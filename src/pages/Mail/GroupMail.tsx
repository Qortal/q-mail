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
import { AllThreadP, GroupContainer, GroupNameP, SingleThreadParent, ThreadContainer, ThreadContainerFullWidth, ThreadInfoColumn, ThreadInfoColumnNameP, ThreadInfoColumnTime, ThreadInfoColumnbyP, ThreadSingleLastMessageP, ThreadSingleLastMessageSpanP, ThreadSingleTitle } from "./Mail-styles";
import { Spacer } from "../../components/common/Spacer";
interface AliasMailProps {
  groupInfo: any;
  currentThread: any;
  setCurrentThread: React.Dispatch<any>
  setFilterMode: React.Dispatch<any>
  filterMode: string
}
export const GroupMail = ({ groupInfo, setCurrentThread, currentThread, filterMode, setFilterMode }: AliasMailProps) => {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [valueTab, setValueTab] = React.useState(0);
  const [viewedThreads, setViewedThreads] = React.useState<any>({});

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
  const groupIdRef = useRef<any>(null)
  const groupId = useMemo(() => {
    return groupInfo?.id;
  }, [groupInfo]);

  useEffect(()=> {
    if(groupId !== groupIdRef?.current){
      setCurrentThread(null)
      setRecentThreads([])
      setAllThreads([])
      groupIdRef.current = groupId
    }
  }, [groupId])


  const dispatch = useDispatch();
  const navigate = useNavigate();



  const getAllThreads = React.useCallback(
    async (groupId: string, mode: string, isInitial?: boolean) => {
      try {
        const offset = isInitial ? 0 : allThreads.length;
        const isReverse = mode === 'Newest' ? true : false
        if(isInitial){
          dispatch(setIsLoadingCustom("Loading threads"));
        }
        const query = `qortal_qmail_thread_group${groupId}`;
        const url = `/arbitrary/resources/search?mode=ALL&service=${THREAD_SERVICE_TYPE}&query=${query}&limit=${20}&includemetadata=true&offset=${offset}&reverse=${isReverse}&excludeblocked=true`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const responseData = await response.json();

        let fullArrayMsg = isInitial ? [] : [...allThreads];
        const getMessageForThreads = responseData.map(async (message: any) => {

     
          let fullObject: any = null
          if (message?.metadata?.description) {
             fullObject = {
              ...message,
              threadData: {
                title: message?.metadata?.description,
                groupId: groupId,
                createdAt: message?.created,
                name: message?.name,
              },
              threadOwner: message?.name,
            };
          } else {
            let threadRes = null
            try {
               threadRes = await Promise.race([
                qortalRequest({
                  action: "FETCH_QDN_RESOURCE",
                  name: message?.name,
                  service: THREAD_SERVICE_TYPE,
                  identifier: message.identifier
                }),
                delay(5000),
              ]);
            } catch (error) {
              
            }
           
           if(threadRes?.title){
             fullObject = {
              ...message,
              threadData: threadRes,
              threadOwner: message?.name,
            };
           }
            
          }
          if(fullObject?.identifier){
            const index = fullArrayMsg.findIndex(
              p => p.identifier === fullObject.identifier
            );
            if (index !== -1) {
              fullArrayMsg[index] = fullObject;
            } else {
              fullArrayMsg.push(fullObject);
            }
          }
           
        
        
      })
        await Promise.all(getMessageForThreads);
        let sorted = fullArrayMsg
        if(isReverse){
          sorted = fullArrayMsg.sort(
            (a: any, b: any) => b.created - a.created
          );
        } else {
           sorted = fullArrayMsg.sort(
            (a: any, b: any) => a.created - b.created
          );
        }
        
        setAllThreads(sorted)
      } catch (error) {
        console.log({error})
      } finally {
        if(isInitial){
        dispatch(setIsLoadingCustom(null));
        }
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
          .sort((a, b) => b.created - a.created).slice(0, 10)
        let fullThreadArray: any = [];
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
              
            }
          } catch (error) {
            console.log(error)
          }
          return null;
        });
        await Promise.all(getMessageForThreads);
        const sorted = fullThreadArray.sort(
          (a: any, b: any) => b.created - a.created
        );
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
  const filterModeRef = useRef("");

  useEffect(() => {
    if(filterModeRef.current !== filterMode){
      firstMount.current = false
    }
    if (user?.name && groupId && !firstMount.current && members) {
      if(filterMode === 'Recently active'){
        getMessages();

      } else if(filterMode === 'Newest'){
        getAllThreads(groupId, 'Newest', true);

      } else if(filterMode === 'Oldest'){
        getAllThreads(groupId, 'Oldest', true);

      }
      firstMount.current = true;
    }
  }, [user, groupId, members, filterMode]);

  const closeThread = useCallback(() => {
    setCurrentThread(null);
  }, []);





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
    if(groupId){
      getGroupMembers(groupId);
      interval.current = setInterval(async () => {
        getGroupMembers(groupId);
      }, 180000)
    }
    return () => {
      if (interval?.current) {
        clearInterval(interval.current)
      }
    }
  }, [getGroupMembers, groupId]);


  let listOfThreadsToDisplay = recentThreads
  if(filterMode === 'Newest' || filterMode === 'Oldest'){
    listOfThreadsToDisplay = allThreads
  }

  const onSubmitNewThread= useCallback((val: any)=> {
    if(filterMode === 'Recently active'){
      setRecentThreads(prev=> [val, ...prev])
    } else if(filterMode === 'Newest'){
      setAllThreads((prev)=> [val, ...prev])
    }
  }, [filterMode])

  useEffect(()=> {
    if(user?.name){
      const threads = JSON.parse(
        localStorage.getItem(`qmail_threads_viewedtimestamp_${user.name}`) || "{}"
      );
      setViewedThreads(threads)

    }
  }, [user?.name, currentThread])

  


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
    <GroupContainer
      sx={{
        position: "relative",
        overflow: 'auto',
        width: '100%'
      }}
    >
      <NewThread
        groupInfo={groupInfo}
        refreshLatestThreads={getMessages}
        members={members}
        threadCallback={onSubmitNewThread}
      />
      <ThreadContainerFullWidth>
        <ThreadContainer>
          <Spacer height="60px" />
          <GroupNameP>{groupInfo?.name}</GroupNameP>
          <Spacer height="60px" />
          <AllThreadP>All Threads ({filterMode})</AllThreadP>
          <Spacer height="30px" />
          
              {listOfThreadsToDisplay.map(thread => {
                const hasViewedRecent = viewedThreads[`qmail_threads_${thread?.threadData?.groupId}_${thread?.threadId}`]
                const shouldAppearLighter = hasViewedRecent && filterMode === 'Recently active' && thread?.threadData?.createdAt < hasViewedRecent?.timestamp
            return (
              <SingleThreadParent
                onClick={() => {
                  setCurrentThread(thread);
                }}
               
              >
                 <AvatarWrapper isAlias={false} height="50px" user={thread?.threadData?.name} fallback={thread?.threadData?.name}></AvatarWrapper>
                <ThreadInfoColumn>
                <ThreadInfoColumnNameP><ThreadInfoColumnbyP>by </ThreadInfoColumnbyP>{thread?.threadData?.name}</ThreadInfoColumnNameP>
                <ThreadInfoColumnTime>{formatTimestamp(thread?.threadData?.createdAt)}</ThreadInfoColumnTime>
                </ThreadInfoColumn>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <ThreadSingleTitle sx={{
                    fontWeight: shouldAppearLighter && 300
                  }}>{thread?.threadData?.title}</ThreadSingleTitle>
                  {filterMode === 'Recently active' && (
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
                  )}
                 
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
             {listOfThreadsToDisplay.length >= 20 && filterMode !== 'Recently active' && (
              <LazyLoad onLoadMore={()=> getAllThreads(groupId, filterMode, false)}></LazyLoad>

      )}
          
          </Box>
        </ThreadContainer>
      </ThreadContainerFullWidth>
    </GroupContainer>
  );
};
