// src/app/[locale]/contact/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  useToast,
  Image as ChakraImage,
  VStack,
  Text,
  InputGroup,
  InputLeftElement,
  Tooltip,
  Icon,
  Spinner,
  FormErrorMessage,
  useColorModeValue,
  SlideFade,
  HStack,
} from "@chakra-ui/react";
import { EmailIcon, AttachmentIcon, InfoOutlineIcon, CloseIcon } from "@chakra-ui/icons";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
// import { useRouter } from "next/navigation"; // 使わないなら削除
// import NextLink from "next/link"; // 使わないなら削除

// 許可する MIME タイプ
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
];
// 5MB のファイルサイズ上限
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// お問い合わせ内容の最大文字数
const MAX_CONTENT_LENGTH = 5000;

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const toast = useToast();
  const { data: session } = useSession();
  const { executeRecaptcha } = useGoogleReCaptcha();
  // const router = useRouter(); // 使わないなら削除

  // フォーム入力値
  const [email, setEmail] = useState(session?.user?.email || "");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");

  // 複数ファイル添付用
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 送信中フラグ・バリデーション用
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // バリデーションチェック
  const isEmailError = email.trim() === "";
  const isContentError = content.trim() === "";
  const isContentTooLong = content.length > MAX_CONTENT_LENGTH;

  // ドロップゾーン設定
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles: File[] = [];
      const validPreviews: string[] = [];

      acceptedFiles.forEach((file) => {
        // MIME チェック
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          toast({
            title: "File type error",
            description: `Unsupported file type: ${file.type}`,
            status: "error",
            isClosable: true,
          });
          return;
        }
        // サイズチェック
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "File size error",
            description: `File size exceeds 5MB limit: ${file.name}`,
            status: "error",
            isClosable: true,
          });
          return;
        }

        validFiles.push(file);
        validPreviews.push(URL.createObjectURL(file));
      });

      if (validFiles.length > 0) {
        setAttachments((prev) => [...prev, ...validFiles]);
        setPreviewUrls((prev) => [...prev, ...validPreviews]);
      }
    },
    [toast]
  );

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
      "application/pdf": [],
    },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  // フォーム送信時
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!executeRecaptcha) {
      toast({
        title: "Error",
        description: "Failed to load reCAPTCHA. Please try again.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    if (isEmailError || isContentError || isContentTooLong) {
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await executeRecaptcha("contact_form");
      const formData = new FormData();
      formData.append("email", email);
      formData.append("category", category);
      formData.append("content", content);
      formData.append("gRecaptchaToken", token);

      attachments.forEach((file) => {
        formData.append("attachment", file);
      });

      const res = await fetch(`/api/contact`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to send contact");
      }

      toast({
        title: t("successTitle"),
        description: t("successDesc"),
        status: "success",
        isClosable: true,
      });

      // フォームリセット
      setEmail("");
      setCategory("general");
      setContent("");
      setAttachments([]);
      setPreviewUrls([]);
      setSubmitted(false);
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: t("errorTitle"),
        description: t("errorDesc"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // カラー
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");

  return (
    <SlideFade in offsetY="20px">
      <Box
        maxW="lg"
        mx="auto"
        mt={8}
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <Heading as="h1" size="lg" mb={6} textAlign="center">
          {t("title")}
        </Heading>

        <form onSubmit={handleSubmit}>
          {/* メールアドレス */}
          <FormControl mb={4} isRequired isInvalid={submitted && isEmailError}>
            <FormLabel>
              {t("emailLabel")}{" "}
              <Tooltip
                label={t("emailTooltip") || "We'll use this email to contact you back"}
                fontSize="sm"
              >
                <InfoOutlineIcon w={3} h={3} ml={1} />
              </Tooltip>
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <EmailIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </InputGroup>
            {submitted && isEmailError && (
              <FormErrorMessage>Email is required.</FormErrorMessage>
            )}
          </FormControl>

          {/* 種別 */}
          <FormControl mb={4}>
            <FormLabel>{t("categoryLabel")}</FormLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">{t("categoryGeneral")}</option>
              <option value="bug">{t("categoryBug")}</option>
              <option value="feature">{t("categoryFeature")}</option>
              <option value="other">{t("categoryOther")}</option>
            </Select>
          </FormControl>

          {/* お問い合わせ内容 */}
          <FormControl
            mb={4}
            isRequired
            isInvalid={(submitted && isContentError) || isContentTooLong}
          >
            <FormLabel>
              {t("contentLabel")}{" "}
              <Tooltip
                label={t("contentTooltip") || "Please provide as many details as possible"}
                fontSize="sm"
              >
                <InfoOutlineIcon w={3} h={3} ml={1} />
              </Tooltip>
            </FormLabel>
            <Textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("contentPlaceholder") || ""}
              required
            />
            {submitted && isContentError && (
              <FormErrorMessage>Message is required.</FormErrorMessage>
            )}
            {isContentTooLong && (
              <FormErrorMessage>
                {`Message is too long. (Max ${MAX_CONTENT_LENGTH} characters)`}
              </FormErrorMessage>
            )}
          </FormControl>

          {/* ファイル添付 */}
          <FormControl mb={4}>
            <FormLabel>
              {t("attachLabel")}{" "}
              <Icon as={AttachmentIcon} ml={1} color="gray.500" />
            </FormLabel>
            <Box
              {...getRootProps()}
              p={4}
              border="2px dashed"
              borderColor={isDragActive ? "blue.300" : borderColor}
              rounded="md"
              textAlign="center"
              cursor="pointer"
              transition="border 0.2s ease"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <Text color="blue.500">
                  {t("dropHere") || "Drop files here..."}
                </Text>
              ) : (
                <Text color="gray.500">
                  {t("clickOrDrop") || "Click or drop files here (PDF or image)"}
                </Text>
              )}
            </Box>

            {/* 添付ファイルのプレビュー一覧 */}
            {attachments.length > 0 && (
              <Box mt={4}>
                {attachments.map((file, index) => (
                  <HStack
                    key={index}
                    mb={2}
                    borderWidth="1px"
                    borderColor={borderColor}
                    p={2}
                    borderRadius="md"
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center">
                      {file.type.includes("image") && (
                        <ChakraImage
                          src={previewUrls[index]}
                          alt={`preview-${index}`}
                          boxSize="50px"
                          objectFit="cover"
                          borderRadius="md"
                          mr={2}
                        />
                      )}
                      <Text>{file.name}</Text>
                    </Box>
                    <Button
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      variant="ghost"
                      colorScheme="red"
                      leftIcon={<CloseIcon boxSize={3} />}
                    >
                      Remove
                    </Button>
                  </HStack>
                ))}
              </Box>
            )}
          </FormControl>

          {/* 送信ボタン */}
          <VStack align="stretch" mt={8}>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText={
                <Box display="flex" alignItems="center">
                  <Spinner size="sm" mr={2} />
                  {t("loading")}
                </Box>
              }
            >
              {t("submitButton")}
            </Button>
          </VStack>
        </form>
      </Box>
    </SlideFade>
  );
}