// src/components/VisibilitySelector.tsx
"use client";

import React, { useState } from "react";
import {
    Box,
    Heading,
    Text,
    Flex,
    Radio,
    RadioGroup,
    Stack,
    Icon,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast,
    Spinner
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FaLock, FaUsers, FaGlobe, FaBook } from "react-icons/fa";

type BookStatus = "PRIVATE" | "PUBLISHED" | "COMMUNITY" | "PUBLIC";

interface VisibilitySelectorProps {
    bookId: number;
    currentStatus: BookStatus;
    onStatusChange?: (newStatus: BookStatus) => void;
}

export default function VisibilitySelector({
    bookId,
    currentStatus,
    onStatusChange
}: VisibilitySelectorProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<BookStatus>(currentStatus);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("common");
    const toast = useToast();

    const handleStatusChange = async (newStatus: BookStatus) => {
        if (newStatus === selectedStatus) return;
        
        setError(null);
        setIsUpdating(true);
        
        try {
            console.log(`Changing status to: ${newStatus}`);
            
            const res = await fetch(`/api/ehon/${bookId}/visibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            let data;
            try {
                // レスポンスのJSONパースを試みる
                const text = await res.text();
                console.log("Raw response:", text);
                
                // 空でなければJSONにパース
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                throw new Error(`レスポンスの解析に失敗しました: ${parseError}`);
            }

            if (!res.ok) {
                throw new Error(data?.error || `ステータスコード: ${res.status}`);
            }

            setSelectedStatus(newStatus);

            // イベントハンドラが提供されている場合は呼び出し
            if (onStatusChange) {
                onStatusChange(newStatus);
            }

            // ポイント付与された場合は特別なメッセージを表示
            if (data.pointsAdded > 0) {
                toast({
                    title: t("visibilityUpdated"),
                    description: t("publicRewardPointsEarned"),
                    status: "success",
                    duration: 3000,
                });
            } else {
                toast({
                    title: t("visibilityUpdated"),
                    description: getStatusChangeMessage(newStatus),
                    status: "success",
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error("Status change error:", error);
            
            // エラーメッセージを状態に保存
            setError(error instanceof Error ? error.message : String(error));
            
            toast({
                title: t("updateFailed"),
                description: error instanceof Error ? error.message : "エラーが発生しました",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            
            // エラー時は選択状態を元に戻す
            setSelectedStatus(currentStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    // ステータス変更メッセージの取得
    const getStatusChangeMessage = (status: BookStatus): string => {
        switch (status) {
            case "PRIVATE":
                return t("visibilityChangedPRIVATE");
            case "PUBLISHED":
                return t("visibilityChangedPUBLISHED");
            case "COMMUNITY":
                return t("visibilityChangedCOMMUNITY");
            case "PUBLIC":
                return t("visibilityChangedPUBLIC");
            default:
                return t("visibilityUpdated");
        }
    };

    return (
        <Box mt={6} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            <Heading size="sm" mb={3}>{t("visibilitySettings")}</Heading>

            {isUpdating && (
                <Alert status="info" mb={4}>
                    <AlertIcon />
                    <Flex align="center">
                        <Spinner size="sm" mr={2} />
                        <Text>設定を更新中...</Text>
                    </Flex>
                </Alert>
            )}
            
            {error && (
                <Alert status="error" mb={4}>
                    <AlertIcon />
                    <Box>
                        <AlertTitle>エラーが発生しました</AlertTitle>
                        <AlertDescription fontSize="sm">
                            {error}
                            <Text fontSize="xs" mt={1}>
                                このエラーが続く場合は、管理者にお問い合わせください。
                            </Text>
                        </AlertDescription>
                    </Box>
                </Alert>
            )}

            <RadioGroup
                value={selectedStatus}
                onChange={(val) => handleStatusChange(val as BookStatus)}
            >
                <Stack spacing={3}>
                    <Radio value="PRIVATE" isDisabled={isUpdating}>
                        <Flex align="center">
                            <Icon as={FaLock} mr={2} color="gray.600" />
                            <Box>
                                <Text fontWeight="bold">{t("privateStatus")}</Text>
                                <Text fontSize="xs" color="gray.600">{t("privateDescription")}</Text>
                            </Box>
                        </Flex>
                    </Radio>

                    <Radio value="PUBLISHED" isDisabled={isUpdating}>
                        <Flex align="center">
                            <Icon as={FaBook} mr={2} color="blue.600" />
                            <Box>
                                <Text fontWeight="bold">{t("publishedStatus")}</Text>
                                <Text fontSize="xs" color="gray.600">{t("publishedDescription")}</Text>
                            </Box>
                        </Flex>
                    </Radio>

                    <Radio value="COMMUNITY" isDisabled={isUpdating}>
                        <Flex align="center">
                            <Icon as={FaUsers} mr={2} color="green.600" />
                            <Box>
                                <Text fontWeight="bold">{t("communityStatus")}</Text>
                                <Text fontSize="xs" color="gray.600">{t("communityDescription")}</Text>
                            </Box>
                        </Flex>
                    </Radio>

                    <Radio value="PUBLIC" isDisabled={isUpdating}>
                        <Flex align="center">
                            <Icon as={FaGlobe} mr={2} color="purple.600" />
                            <Box>
                                <Text fontWeight="bold">{t("publicStatus")}</Text>
                                <Text fontSize="xs" color="gray.600">{t("publicDescription")}</Text>
                                <Text fontSize="xs" color="green.600" fontWeight="bold">
                                    {t("publicRewardPoints", { points: 50 })}
                                </Text>
                            </Box>
                        </Flex>
                    </Radio>
                </Stack>
            </RadioGroup>

            {selectedStatus === "PUBLIC" && (
                <Alert status="info" mt={3} size="sm">
                    <AlertIcon />
                    <Box fontSize="xs">
                        <AlertTitle>{t("publicNoteTitle")}</AlertTitle>
                        <AlertDescription>{t("publicNoteDescription")}</AlertDescription>
                    </Box>
                </Alert>
            )}
        </Box>
    );
}