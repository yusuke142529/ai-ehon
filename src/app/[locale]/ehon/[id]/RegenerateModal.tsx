"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  Textarea,
  Button,
  Collapse,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

// next-intl からの型を直接利用するためにインポート
import { useTranslations } from "next-intl";

/**
 * next-intl が返す翻訳関数 t の型を取得。
 * "common" は必要に応じて変更してください。
 * （親コンポーネントで useTranslations("common") を使用している場合は "common"）
 */
type NextIntlT = ReturnType<typeof useTranslations<"common">>;

/** 再生成モード定義 */
export type RegenerateMode = "samePrompt" | "withFeedback";

/** モーダル用 Props */
export interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  regenMode: RegenerateMode | null;
  setRegenMode: React.Dispatch<React.SetStateAction<RegenerateMode | null>>;
  feedback: string;
  setFeedback: React.Dispatch<React.SetStateAction<string>>;
  onRegenerate: () => Promise<void>;
  /**
   * next-intl が返す翻訳関数 (親コンポーネントで useTranslations("common") したもの)
   */
  t: NextIntlT;
}

/** コンポーネント本体 */
const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  isSaving,
  regenMode,
  setRegenMode,
  feedback,
  setFeedback,
  onRegenerate,
  t,
}) => {
  const [showExamples, setShowExamples] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("editBookRegenModalTitle")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4} p={2} borderWidth="1px" borderRadius="md" bg="yellow.50">
            <Text fontWeight="bold" mb={1}>
              {t("editBookAiDisclaimerTitle")}
            </Text>
            <Text fontSize="sm" color="gray.800">
              {t("editBookAiDisclaimerText")}
            </Text>
            <Text fontSize="sm" color="red.600" fontWeight="bold" mt={3}>
              {t("editBookPointConsumptionNotice")}
            </Text>
          </Box>

          {/* フィードバックを伴う再生成 */}
          <Box
            as="button"
            onClick={() => setRegenMode("withFeedback")}
            borderWidth="2px"
            borderColor={regenMode === "withFeedback" ? "purple.500" : "gray.200"}
            bg={regenMode === "withFeedback" ? "purple.50" : "white"}
            p={4}
            borderRadius="md"
            textAlign="left"
            w="100%"
            transition="all 0.2s ease-in-out"
            mb={4}
          >
            <Text fontWeight="bold" fontSize="md" color="purple.800">
              {t("editBookRegenFeedbackTitle")}
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1}>
              {t("editBookRegenFeedbackDesc")}
            </Text>
          </Box>

          {regenMode === "withFeedback" && (
            <Box mt={4}>
              <Text fontSize="sm" mb={1}>
                {t("editBookRefineFeedbackLabel")}
              </Text>
              <Textarea
                placeholder={t("editBookRefineFeedbackPlaceholder")}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <Box mt={3}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExamples(!showExamples)}
                  rightIcon={showExamples ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {showExamples
                    ? t("editBookHideFeedbackExamples", {
                        defaultValue: "例示文を隠す",
                      })
                    : t("editBookShowFeedbackExamples", {
                        defaultValue: "例示文を表示する",
                      })}
                </Button>

                <Collapse in={showExamples} animateOpacity>
                  <Box mt={2} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                    <Text fontSize="xs" fontWeight="bold" mb={2} color="gray.700">
                      {t("editBookRegenExampleHeading", {
                        defaultValue: "修正要望の例",
                      })}
                    </Text>
                    <UnorderedList ml={5} color="gray.600" fontSize="xs">
                      <ListItem>{t("editBookRegenExamplePattern1")}</ListItem>
                      <ListItem mt={1}>{t("editBookRegenExamplePattern2")}</ListItem>
                      <ListItem mt={1}>{t("editBookRegenExamplePattern3")}</ListItem>
                    </UnorderedList>
                  </Box>
                </Collapse>
              </Box>
            </Box>
          )}

          {/* 同じプロンプトで再生成 */}
          <Box
            as="button"
            onClick={() => setRegenMode("samePrompt")}
            borderWidth="2px"
            borderColor={regenMode === "samePrompt" ? "purple.500" : "gray.200"}
            bg={regenMode === "samePrompt" ? "purple.50" : "white"}
            p={4}
            borderRadius="md"
            textAlign="left"
            w="100%"
            transition="all 0.2s ease-in-out"
            mt={8}
          >
            <Text fontWeight="bold" fontSize="md" color="purple.800">
              {t("editBookRegenSamePromptTitle")}
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1}>
              {t("editBookRegenSamePromptDesc")}
            </Text>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t("cancelButton")}
          </Button>
          <Button colorScheme="purple" isLoading={isSaving} onClick={onRegenerate}>
            {t("editBookRegenConfirmBtn")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RegenerateModal;