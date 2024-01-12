import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Input, Typography, formLabelClasses, useTheme } from "@mui/material";
import { useFetchPosts } from "../../hooks/useFetchPosts";
import LazyLoad from "../../components/common/LazyLoad";
import { removePrefix } from "../../utils/blogIdformats";
import { NewMessage } from "./NewMessage";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useFetchMail } from "../../hooks/useFetchMail";
import { ShowMessage } from "./ShowMessage";
import { addToHashMapMail } from "../../state/features/mailSlice";
import MailIcon from "@mui/icons-material/Mail";
import {
  setIsLoadingCustom,
  setIsLoadingGlobal,
  setUserAvatarHash,
} from "../../state/features/globalSlice";
import SimpleTable, { AvatarWrapper } from "./MailTable";
import { MAIL_SERVICE_TYPE, THREAD_SERVICE_TYPE } from "../../constants/mail";
import { BlogPost } from "../../state/features/blogSlice";
import {
  base64ToUint8Array,
  objectToBase64,
  uint8ArrayToObject,
} from "../../utils/toBase64";
import { formatDate, formatTimestamp } from "../../utils/time";
import { NewThread } from "./NewThread";
import { Thread } from "./Thread";
import { current } from "@reduxjs/toolkit";
import { delay } from "../../utils/helpers";
import { setNotification } from "../../state/features/notificationsSlice";
import { getNameInfo } from "../../utils/apiCalls";
import BackupIcon from "@mui/icons-material/Backup";
import { FlexLayout } from "./FlexLayout";
import { AllThreadP, GroupNameP, SingleThreadParent, ThreadContainer, ThreadContainerFullWidth, ThreadInfoColumn, ThreadInfoColumnNameP, ThreadInfoColumnTime, ThreadInfoColumnbyP, ThreadSingleLastMessageP, ThreadSingleLastMessageSpanP, ThreadSingleTitle } from "./Mail-styles";
import { Spacer } from "../../components/common/Spacer";
interface AliasMailProps {
  groupInfo: any;
  currentThread: any;
  setCurrentThread: React.Dispatch<any>
}
export const GroupMail = ({ groupInfo, setCurrentThread, currentThread }: AliasMailProps) => {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [valueTab, setValueTab] = React.useState(0);
  const [aliasValue, setAliasValue] = useState("");
  const [alias, setAlias] = useState<string[]>([]);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [members, setMembers] = useState<any>(null);
  const hashMapPosts = useSelector(
    (state: RootState) => state.blog.hashMapPosts
  );
  const [mailMessages, setMailMessages] = useState<any[]>([]);
  const hashMapMailMessages = useSelector(
    (state: RootState) => state.mail.hashMapMailMessages
  );

  const groupId = useMemo(() => {
    return groupInfo?.id;
  }, [groupInfo]);

  const fullMailMessages = useMemo(() => {
    return mailMessages.map(msg => {
      let message = msg;
      const existingMessage = hashMapMailMessages[msg.id];
      if (existingMessage) {
        message = existingMessage;
      }
      return message;
    });
  }, [mailMessages, hashMapMailMessages, user]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getAvatar = async (user: string) => {
    try {
      let url = await qortalRequest({
        action: "GET_QDN_RESOURCE_URL",
        name: user,
        service: "THUMBNAIL",
        identifier: "qortal_avatar",
      });
      dispatch(
        setUserAvatarHash({
          name: user,
          url,
        })
      );
    } catch (error) {}
  };

  const getAllThreads = React.useCallback(
    async (groupId: string) => {
      try {
        const offset = allThreads.length;
        dispatch(setIsLoadingCustom("Loading threads"));
        const query = `qortal_qmail_thread_group${groupId}`;
        const url = `/arbitrary/resources/search?mode=ALL&service=${MAIL_SERVICE_TYPE}&query=${query}&limit=${20}&includemetadata=false&offset=${offset}&reverse=true&excludeblocked=true`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const responseData = await response.json();

        let fullArrayMsg = [...allThreads];
        for (const message of responseData) {
          try {
            let threadRes = await qortalRequest({
              action: "FETCH_QDN_RESOURCE",
              name: message.name,
              service: MAIL_SERVICE_TYPE,
              identifier: message.identifier,
              encoding: "base64",
            });
            let requestEncryptThread: any = {
              action: "DECRYPT_DATA",
              encryptedData: threadRes,
            };
            const resDecryptThread = await qortalRequest(requestEncryptThread);
            const decryptToUnit8ArrayThread =
              base64ToUint8Array(resDecryptThread);
            const responseDataThread = uint8ArrayToObject(
              decryptToUnit8ArrayThread
            );
            const fullObject = {
              ...message,
              threadId: message.identifier,
              threadData: responseDataThread,
              threadOwner: message.name,
            };
            const index = allThreads.findIndex(
              p => p.identifier === fullObject.identifier
            );
            if (index !== -1) {
              fullArrayMsg[index] = fullObject;
            } else {
              fullArrayMsg.push(fullObject);
            }
          } catch (error) {
          } finally {
            dispatch(setIsLoadingCustom(null));
          }
        }
        setAllThreads(fullArrayMsg);
      } catch (error) {
      } finally {
        dispatch(setIsLoadingCustom(null));
      }
    },
    [allThreads]
  );

  const getMailMessages = React.useCallback(
    async (groupId: string, members: any) => {
      try {
        const memberNames = Object.keys(members);
        const queryString = memberNames
          .map(name => `&name=${encodeURIComponent(name)}`)
          .join("");

        console.log({ memberNames });
        dispatch(setIsLoadingCustom("Loading recent threads"));
        const query = `qortal_qmail_thmsg_group${groupId}`;
        const url = `/arbitrary/resources/search?mode=ALL&service=${MAIL_SERVICE_TYPE}&query=${query}&limit=100&includemetadata=false&offset=${0}&reverse=true&excludeblocked=true${queryString}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const responseData = await response.json();
        const messagesForThread: any = {};

        for (const message of responseData) {
          let str = message.identifier;
          let parts = str.split("_").reverse();
          let result = parts[1];
          const checkMessage = messagesForThread[result];
          if (!checkMessage) {
            messagesForThread[result] = message;
          }
        }
        const newArray = Object.keys(messagesForThread)
          .map(key => {
            return {
              ...messagesForThread[key],
              threadId: `qortal_qmail_thread_group${groupId}_${key}`,
            };
          })
          .sort((a, b) => b.created - a.created);
        let fullThreadArray: any = [];
        console.log({ newArray });
        const getMessageForThreads = newArray.map(async (message: any) => {
          try {
            const identifierQuery = message.threadId;
            const url = `/arbitrary/resources/search?mode=ALL&service=${THREAD_SERVICE_TYPE}&identifier=${identifierQuery}&limit=1&includemetadata=true&offset=${0}&reverse=true&excludeblocked=true${queryString}`;
            const response = await fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });
            const responseData = await response.json();
            console.log({responseData})
            if (responseData.length > 0) {
              const thread = responseData[0];
              if (thread?.metadata?.description) {
                const fullObject = {
                  ...message,
                  threadData: {
                    title: thread?.metadata?.description,
                    groupId: groupId,
                    createdAt: thread?.created,
                    name: thread?.name,
                  },
                  threadOwner: thread?.name,
                };
                fullThreadArray.push(fullObject);
              } else {
                console.log('entered1')
                let threadRes = await Promise.race([
                  qortalRequest({
                    action: "FETCH_QDN_RESOURCE",
                    name: thread?.name,
                    service: THREAD_SERVICE_TYPE,
                    identifier: message.threadId
                  }),
                  delay(5000),
                ]);
               if(threadRes?.title){
                const fullObject = {
                  ...message,
                  threadData: threadRes,
                  threadOwner: thread?.name,
                };
                fullThreadArray.push(fullObject);
               }
                
              }
              // let messageRes = await Promise.race([
              //   qortalRequest({
              //     action: 'FETCH_QDN_RESOURCE',
              //     ngetMailMessagesme: message.name,
              //     service: MAIL_SERVICE_TYPE,
              //     identifier: message.identifier,
              //     encoding: 'base64'
              //   }),
              //   delay(7000)
              // ])
              // let requestEncryptBody: any = {
              //   action: 'DECRYPT_DATA',
              //   encryptedData: messageRes
              // }
              // const resDecrypt = await qortalRequest(requestEncryptBody)

              // const decryptToUnit8ArrayMessage = base64ToUint8Array(resDecrypt)
              // const responseDataMessage = uint8ArrayToObject(
              //   decryptToUnit8ArrayMessage
              // )
            }
          } catch (error) {
            console.log('error2', error)
          }
          return null;
        });
        await Promise.all(getMessageForThreads);
        const sorted = fullThreadArray.sort(
          (a: any, b: any) => b.created - a.created
        );
        console.log({sorted})
        setRecentThreads(sorted);
      } catch (error) {
      } finally {
        dispatch(setIsLoadingCustom(null));
      }
    },
    []
  );
  const getMessages = React.useCallback(async () => {
    if (!user?.name || !groupId) return;
    await getMailMessages(groupId, members);
  }, [getMailMessages, user, groupId, members]);

  const interval = useRef<any>(null);

  const firstMount = useRef(false);
  useEffect(() => {
    if (user?.name && groupId && !firstMount.current && members) {
      getMessages();
      firstMount.current = true;
    }
  }, [user, groupId, members]);

  const closeThread = useCallback(() => {
    setCurrentThread(null);
  }, []);



  const republishThread = async (thread: any) => {
    try {
      dispatch(setIsLoadingGlobal(true));
      const threadData = thread?.threadData;
      if (!threadData) throw new Error("Cannot find thread data");
      const response = await fetch(
        `/groups/members/${threadData?.groupId}?limit=0`
      );
      const groupData = await response.json();

      let groupPublicKeys: string[] = [];
      if (groupData && Array.isArray(groupData?.members)) {
        for (const member of groupData.members) {
          if (member.member) {
            const res = await getNameInfo(member.member);
            const resAddress = await qortalRequest({
              action: "GET_ACCOUNT_DATA",
              address: member.member,
            });
            const name = res;
            const publicKey = resAddress.publicKey;
            if (publicKey) {
              groupPublicKeys.push(publicKey);
            }
          }
        }
      }
      if (!groupPublicKeys || groupPublicKeys.length < 1) {
        throw new Error("Cannot get public keys");
      }
      const threadObject = threadData;
      const threadToBase64 = await objectToBase64(threadObject);

      let requestBodyThread: any = {
        name: thread.threadOwner,
        service: MAIL_SERVICE_TYPE,
        data64: threadToBase64,
        identifier: thread.threadId,
      };

      const multiplePublishMsg = {
        action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
        resources: [requestBodyThread],
        encrypt: true,
        publicKeys: groupPublicKeys,
      };
      await qortalRequest(multiplePublishMsg);
      dispatch(
        setNotification({
          msg: "Re-published with new public keys",
          alertType: "success",
        })
      );
    } catch (error) {
    } finally {
      dispatch(setIsLoadingGlobal(false));
    }
  };

  const getGroupMembers = useCallback(async (groupNumber: string) => {
    try {
      const response = await fetch(`/groups/members/${groupNumber}?limit=0`);
      const groupData = await response.json();

      let members: any = {};
      if (groupData && Array.isArray(groupData?.members)) {
        for (const member of groupData.members) {
          if (member.member) {
            const res = await getNameInfo(member.member);
            const resAddress = await qortalRequest({
              action: "GET_ACCOUNT_DATA",
              address: member.member,
            });
            const name = res;
            const publicKey = resAddress.publicKey;
            if (name) {
              members[name] = {
                publicKey,
                address: member.member,
              };
            }
          }
        }
      }

      setMembers(members);
    } catch (error) {
      console.log({ error });
    }
  }, []);

  useEffect(() => {
    getGroupMembers(groupId);
  }, [getGroupMembers, groupId]);

  console.log({ members });

  if (currentThread)
    return (
      <Thread
          currentThread={currentThread}
          groupInfo={groupInfo}
          closeThread={closeThread}
          members={members}
        />
    );

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <NewThread
        groupInfo={groupInfo}
        refreshLatestThreads={getMessages}
        members={members}
      />
      <ThreadContainerFullWidth>
        <ThreadContainer>
          <Spacer height="60px" />
          <GroupNameP>{groupInfo?.name}</GroupNameP>
          <Spacer height="60px" />
          <AllThreadP>All Threads</AllThreadP>
          <Spacer height="30px" />

          {recentThreads.map(thread => {
            return (
              <SingleThreadParent
                onClick={() => {
                  setCurrentThread(thread);
                }}
               
              >
                 <AvatarWrapper isAlias={false} height="50px" user={thread?.threadData?.name} fallback={thread?.threadData?.name}></AvatarWrapper>
                <ThreadInfoColumn>
                <ThreadInfoColumnNameP><ThreadInfoColumnbyP>by </ThreadInfoColumnbyP>{thread?.threadData?.name}</ThreadInfoColumnNameP>
                <ThreadInfoColumnTime>{formatTimestamp(thread?.threadData?.created)}</ThreadInfoColumnTime>
                </ThreadInfoColumn>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <ThreadSingleTitle>{thread?.threadData?.title}</ThreadSingleTitle>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ThreadSingleLastMessageP
                   
                    >
                      <ThreadSingleLastMessageSpanP>last message: </ThreadSingleLastMessageSpanP>
                      {formatDate(thread?.created)}
                    </ThreadSingleLastMessageP>
                  </div>
                </div>
              </SingleThreadParent>
            );
          })}

          <Box
            sx={{
              width: "100%",
              justifyContent: "center",
            }}
          >
            {allThreads.length === 0 && (
              <Button
                variant="contained"
                onClick={() => getAllThreads(groupId)}
              >
                Load all threads
              </Button>
            )}
            {allThreads.length > 0 && (
              <div>
                <p>All threads</p>
              </div>
            )}

            {allThreads.map(thread => {
              return (
                <div
                  onClick={() => {
                    setCurrentThread(thread);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "5px 10px",
                    gap: "20px",
                    padding: "20px 10px",
                    border: "solid 1px",
                    borderRadius: "5px",
                    marginBottom: "10px",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <MailIcon />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography>{thread?.threadData?.title}</Typography>
                  </div>
                </div>
              );
            })}

            {allThreads.length > 0 && (
              <Button
                variant="contained"
                onClick={() => getAllThreads(groupId)}
              >
                Load more threads
              </Button>
            )}
          </Box>
        </ThreadContainer>
      </ThreadContainerFullWidth>
    </div>
  );
};
