import React, { useEffect, useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Typography } from "@mui/material";
import { formatFullTimestamp } from "../../utils/time";
import { MailMessageRow } from "./MailMessageRow";
import { AvatarWrapper } from "./MailTable";
import { MessagesContainer } from "./Mail-styles";
import {
  getSentRecipientDisplayLabel,
  getSentRecipientGroupKey,
} from "./mailIdentifier";

type MailboxType = "inbox" | "sent";

interface GroupedMailboxListProps {
  messages: any[];
  mailboxType: MailboxType;
  openMessage: (
    user: string,
    identifier: string,
    content: any,
    alias?: string
  ) => void | Promise<void>;
  openedMessageId?: string | number | null;
  onDeleteMessage?: (message: any) => void | boolean | Promise<void | boolean>;
  isDeletingMessage?: (messageId: string) => boolean;
}

interface MessageGroup {
  key: string;
  label: string;
  latestCreatedAt: number | string;
  messages: any[];
}

const toTimestamp = (value: number | string | undefined | null): number => {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const sortMessagesByCreatedDescending = (a: any, b: any): number => {
  return toTimestamp(b?.createdAt) - toTimestamp(a?.createdAt);
};

export const GroupedMailboxList = ({
  messages,
  mailboxType,
  openMessage,
  openedMessageId,
  onDeleteMessage,
  isDeletingMessage,
}: GroupedMailboxListProps) => {
  const groupedMessages = useMemo(() => {
    const groupMap = new Map<string, MessageGroup>();

    messages.forEach(message => {
      const identifier = message?.id || message?.identifier;
      if (!identifier) return;

      let key = "";
      let label = "";

      if (mailboxType === "sent") {
        key = getSentRecipientGroupKey(identifier);
        label = getSentRecipientDisplayLabel(identifier);
      } else {
        const sender = typeof message?.user === "string" ? message.user.trim() : "";
        key = sender ? `sender:${sender.toLowerCase()}` : "sender:unknown";
        label = sender || "Unknown sender";
      }

      const existingGroup = groupMap.get(key);
      if (existingGroup) {
        existingGroup.messages.push(message);
        if (toTimestamp(message?.createdAt) > toTimestamp(existingGroup.latestCreatedAt)) {
          existingGroup.latestCreatedAt = message?.createdAt || 0;
        }
        return;
      }

      groupMap.set(key, {
        key,
        label,
        latestCreatedAt: message?.createdAt || 0,
        messages: [message],
      });
    });

    const groups = Array.from(groupMap.values()).map(group => ({
      ...group,
      messages: [...group.messages].sort(sortMessagesByCreatedDescending),
    }));

    groups.sort((a, b) => toTimestamp(b.latestCreatedAt) - toTimestamp(a.latestCreatedAt));
    return groups;
  }, [messages, mailboxType]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedGroups(previousState => {
      const nextState: Record<string, boolean> = {};
      groupedMessages.forEach(group => {
        if (previousState[group.key]) {
          nextState[group.key] = true;
        }
      });
      return nextState;
    });
  }, [groupedMessages]);

  useEffect(() => {
    if (!openedMessageId) return;

    const normalizedOpenId = String(openedMessageId);
    const groupToExpand = groupedMessages.find(group => {
      if (group.messages.length <= 1) return false;
      return group.messages.some(message => {
        const messageId = message?.id || message?.identifier;
        return String(messageId) === normalizedOpenId;
      });
    });

    if (!groupToExpand) return;

    setExpandedGroups(previousState => {
      if (previousState[groupToExpand.key]) return previousState;
      return {
        ...previousState,
        [groupToExpand.key]: true,
      };
    });
  }, [groupedMessages, openedMessageId]);

  const onToggleGroup = (groupKey: string) => {
    setExpandedGroups(previousState => ({
      ...previousState,
      [groupKey]: !previousState[groupKey],
    }));
  };

  if (!groupedMessages.length) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "220px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--qmail-thread-subtle-text)",
        }}
      >
        <Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>
          No messages to display.
        </Typography>
      </Box>
    );
  }

  return (
    <MessagesContainer>
      {groupedMessages.map(group => {
        if (group.messages.length === 1) {
          const singleMessage = group.messages[0];
          const singleId = singleMessage?.id || singleMessage?.identifier;

          return (
            <MailMessageRow
              key={singleId}
              messageData={singleMessage}
              openMessage={openMessage}
              isFromSent={mailboxType === "sent"}
              useFullTimestamp
              onDeleteMessage={mailboxType === "sent" ? onDeleteMessage : undefined}
              isDeleting={
                mailboxType === "sent" && Boolean(singleId) && isDeletingMessage
                  ? isDeletingMessage(String(singleId))
                  : false
              }
              isOpen={
                openedMessageId !== null &&
                openedMessageId !== undefined &&
                String(openedMessageId) === String(singleId)
              }
            />
          );
        }

        const isExpanded = Boolean(expandedGroups[group.key]);
        const latestMessage = group.messages[0];
        const latestMessageDate = formatFullTimestamp(latestMessage?.createdAt);
        const isAliasGroup = mailboxType === "sent" && group.key.startsWith("alias:");

        return (
          <Box
            key={group.key}
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Box
              onClick={() => {
                onToggleGroup(group.key);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                width: "100%",
                borderRadius: "12px",
                cursor: "pointer",
                border: "1px solid var(--qmail-shell-border)",
                background: "var(--qmail-shell-hover)",
                padding: "10px 14px",
                "&:hover": {
                  background: "var(--qmail-shell-hover-strong)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <AvatarWrapper
                  isAlias={isAliasGroup}
                  height="50px"
                  user={group.label}
                  fallback={group.label}
                />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {mailboxType === "sent" ? "To: " : ""}
                    {group.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--qmail-thread-subtle-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {group.messages.length} messages • {latestMessageDate}
                  </Typography>
                </Box>
              </Box>
              <ExpandMoreIcon
                sx={{
                  color: "var(--qmail-thread-subtle-text)",
                  transform: isExpanded ? "rotate(180deg)" : "rotate(90deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </Box>
            {isExpanded && (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  pl: {
                    xs: "0px",
                    md: "28px",
                  },
                }}
              >
                {group.messages.map(message => {
                  const messageId = message?.id || message?.identifier;
                  return (
                    <MailMessageRow
                      key={messageId}
                      messageData={message}
                      openMessage={openMessage}
                      isFromSent={mailboxType === "sent"}
                      compact
                      useFullTimestamp
                      onDeleteMessage={
                        mailboxType === "sent" ? onDeleteMessage : undefined
                      }
                      isDeleting={
                        mailboxType === "sent" && Boolean(messageId) && isDeletingMessage
                          ? isDeletingMessage(String(messageId))
                          : false
                      }
                      isOpen={
                        openedMessageId !== null &&
                        openedMessageId !== undefined &&
                        String(openedMessageId) === String(messageId)
                      }
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}
    </MessagesContainer>
  );
};
