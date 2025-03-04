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
    useToast
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
    const t = useTranslations("common");
    const toast = useToast();

    const handleStatusChange = async (newStatus: BookStatus) => {
        if (newStatus === selectedStatus) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/ehon/${bookId}/visibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "更新に失敗しました");
            }

            setSelectedStatus(newStatus);

            // イベントハンドラが提供されている場合は呼び出し
            if (onStatusChange) {
                onStatusChange(newStatus);
            }

            toast({
                title: t("visibilityUpdated"),
                description: getStatusChangeMessage(newStatus),
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: t("updateFailed"),
                description: error instanceof Error ? error.message : "エラーが発生しました",
                status: "error",
                duration: 3000,
            });
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