"use client";

import React, { useState, FormEvent, useCallback } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Avatar,
  Box,
  Text,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { v4 as uuidv4 } from "uuid";
import { mutate } from "swr";
import { useTranslations } from "next-intl";
import getCroppedImg from "./utils/getCroppedImg";

/**
 * ユーザーデータ型 (idを string に修正)
 */
type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  points: number;
};

interface EditProfileModalProps {
  user: UserData;
}

export default function EditProfileModal({ user }: EditProfileModalProps) {
  const t = useTranslations("common");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // フォーム状態
  const [name, setName] = useState(user.name || "");
  const [image, setImage] = useState(user.image || "");
  const [isLoading, setIsLoading] = useState(false);

  // ドラッグ＆ドロップ + クロップ用
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<
    { x: number; y: number; width: number; height: number } | null
  >(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // ドロップコールバック
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => setPreviewSrc(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    multiple: false,
  });

  // クロップ完了
  const onCropComplete = useCallback(
    (_: unknown, areaPixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(areaPixels);
    },
    []
  );

  // アイコン画像アップロード
  const handleUploadIcon = async () => {
    if (!previewSrc || !croppedAreaPixels) {
      alert(t("profileEditNoImage"));
      return;
    }
    setIsLoading(true);
    try {
      // 1. トリミング結果の Blob を取得
      const { file: croppedBlob } = await getCroppedImg(previewSrc, croppedAreaPixels);

      // 2. FormData に詰めて送信
      const formData = new FormData();
      const fileName = `icon_${uuidv4()}.png`;
      formData.append("file", croppedBlob, fileName);

      const res = await fetch("/api/user/uploadIcon", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(t("profileEditUploadFailed"));
      }
      const data = await res.json();
      if (!data.image) {
        throw new Error(t("profileEditNoImageReturned"));
      }

      // アップロード成功 => 状態更新
      setImage(data.image);
      // リセット
      setPreviewSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      alert(t("profileEditUploadDone"));
    } catch (error: unknown) {
      console.error(error);
      let message = t("profileEditUploadFailed");
      if (error instanceof Error) {
        message = error.message;
      }
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // プロフィール保存 (名前 & image)
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/updateProfile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          image: image,
        }),
      });
      if (!res.ok) {
        throw new Error(t("profileEditSaveFailed"));
      }
      // SWR の再検証
      mutate("/api/user/me");
      alert(t("profileEditSaveDone"));
      onClose();
    } catch (error: unknown) {
      console.error(error);
      let message = t("profileEditSaveFailed");
      if (error instanceof Error) {
        message = error.message;
      }
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button colorScheme="blue" onClick={onOpen}>
        {t("profileEditBtn")}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("profileEditTitle")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* 名前フィールド */}
            <FormControl mb={4}>
              <FormLabel>{t("profileEditNameLabel")}</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profileEditNamePlaceholder")}
              />
            </FormControl>

            {/* 現在のアイコン */}
            <Text mb={2}>{t("profileEditCurrentIcon")}</Text>
            <Avatar src={image || ""} size="xl" showBorder borderColor="gray.300" mb={4} />

            {/* 画像ドロップゾーン or Cropper */}
            {previewSrc ? (
              <Box position="relative" w="100%" h="300px" border="1px solid #ddd">
                <Cropper
                  image={previewSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  objectFit="cover"
                />
              </Box>
            ) : (
              <Box
                {...getRootProps()}
                border="2px dashed #999"
                p={4}
                textAlign="center"
                cursor="pointer"
                borderRadius="md"
                transition="border 0.2s ease"
                _hover={{ borderColor: "blue.300" }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <Text>{t("profileEditDropActive")}</Text>
                ) : (
                  <Text>{t("profileEditDropNotice")}</Text>
                )}
              </Box>
            )}

            {/* ズームスライダー */}
            {previewSrc && (
              <FormControl mt={2}>
                <FormLabel>{t("profileEditZoom")}</FormLabel>
                <Input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                />
              </FormControl>
            )}

            {/* [アップロード] ボタン */}
            {previewSrc && (
              <Button
                mt={3}
                onClick={handleUploadIcon}
                isLoading={isLoading}
                loadingText={t("profileEditUploading")}
              >
                {t("profileEditUseThisImage")}
              </Button>
            )}
          </ModalBody>

          <ModalFooter>
            <Button mr={3} variant="outline" onClick={onClose}>
              {t("cancelBtn")}
            </Button>
            <Button colorScheme="blue" onClick={handleSaveProfile} isLoading={isLoading}>
              {t("profileEditSaveProfileBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}