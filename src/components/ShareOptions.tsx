// src/components/ShareOptions.tsx
"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    Collapse,
    Text,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    useToast,
    Spacer,
    Flex
} from "@chakra-ui/react";
import { FaShareAlt, FaCopy, FaTwitter, FaFacebook } from "react-icons/fa";
import { SiLine } from "react-icons/si";
import { useTranslations, useLocale } from "next-intl";

interface ShareOptionsProps {
    bookId: number;
    title: string;
    status: string; // "PUBLIC" 等
}

export default function ShareOptions({ bookId, title, status }: ShareOptionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations("common");
    const toast = useToast();

    // 現在のロケールを取得
    const locale = useLocale();

    // 公開状態でない絵本なら何も表示しない
    if (status !== "PUBLIC") {
        return null;
    }

    // 共有用URL (ロケール付き)
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/${locale}/share/${bookId}`;
    const shareText = `${t("shareDefaultText")}「${title}」${t("shareDefaultSuffix")}`;

    // リンクをクリップボードにコピー
    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast({
            title: t("linkCopied"),
            status: "success",
            duration: 2000,
        });
    };

    // SNS共有用のURL生成
    const getSocialShareUrl = (platform: "twitter" | "facebook" | "line") => {
        switch (platform) {
            case "twitter":
                return `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
            case "facebook":
                return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            case "line":
                return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
            default:
                return shareUrl;
        }
    };

    // SNSで共有
    const shareToSocial = (platform: "twitter" | "facebook" | "line") => {
        const url = getSocialShareUrl(platform);
        window.open(url, "_blank", "width=600,height=400");
    };

    return (
        <Box mt={4}>
            {/* シェアボタン */}
            <Button
                colorScheme="blue"
                leftIcon={<FaShareAlt />}
                onClick={() => setIsOpen(!isOpen)}
                size="md"
            >
                {t("shareBook")}
            </Button>

            <Collapse in={isOpen} animateOpacity>
                <Box
                    mt={3}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="gray.50"
                >
                    {/* 「共有できます」などの説明文 */}
                    <Text fontSize="sm" mb={2}>
                        {t("shareText")}
                    </Text>

                    {/* 共有URLの表示＆コピー */}
                    <InputGroup size="sm" mb={3}>
                        <Input
                            value={shareUrl}
                            isReadOnly
                            bg="white"
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label="Copy link"
                                icon={<FaCopy />}
                                size="xs"
                                onClick={copyToClipboard}
                            />
                        </InputRightElement>
                    </InputGroup>

                    {/* SNS共有ボタン */}
                    <Flex alignItems="center" flexWrap="wrap" gap={2}>
                        <Text fontSize="xs" fontWeight="bold" mr={1}>
                            {t("shareWith")}:
                        </Text>

                        <IconButton
                            aria-label="Share on Twitter"
                            icon={<FaTwitter />}
                            colorScheme="twitter"
                            size="sm"
                            onClick={() => shareToSocial("twitter")}
                        />
                        <IconButton
                            aria-label="Share on Facebook"
                            icon={<FaFacebook />}
                            colorScheme="facebook"
                            size="sm"
                            onClick={() => shareToSocial("facebook")}
                        />
                        <IconButton
                            aria-label="Share on LINE"
                            icon={<SiLine />}
                            colorScheme="green"
                            size="sm"
                            onClick={() => shareToSocial("line")}
                        />
                        <Spacer />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            {t("close")}
                        </Button>
                    </Flex>

                    <Text fontSize="xs" color="gray.500" mt={2}>
                        {t("sharePrivacyNote")}
                    </Text>
                </Box>
            </Collapse>
        </Box>
    );
}
