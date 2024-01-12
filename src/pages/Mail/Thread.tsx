import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../state/store'

import {
  Box,
  Button,
  Input,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material'
import { MAIL_SERVICE_TYPE } from '../../constants/mail'
import { base64ToUint8Array, uint8ArrayToObject } from '../../utils/toBase64'
import { ShowMessage } from './ShowMessageWithoutModal'
import { NewThread } from './NewThread'
import {
  setIsLoadingCustom,
  setIsLoadingGlobal
} from '../../state/features/globalSlice'
import { addToHashMapMail } from '../../state/features/mailSlice'
import { ComposeP, GroupNameP, MailIconImg, ShowMessageReturnButton, SingleThreadParent, ThreadContainer, ThreadContainerFullWidth } from './Mail-styles'
import { Spacer } from '../../components/common/Spacer'
import ReturnSVG from '../../assets/svgs/Return.svg'
interface ThreadProps {
  currentThread: any
  groupInfo: any
  closeThread: () => void
  members: any
}
export const Thread = ({
  currentThread,
  groupInfo,
  closeThread,
  members
}: ThreadProps) => {
  const theme = useTheme()
  const { user } = useSelector((state: RootState) => state.auth)
  const [messages, setMessages] = useState<any[]>([])
  const dispatch = useDispatch()
  const hashMapMailMessages = useSelector(
    (state: RootState) => state.mail.hashMapMailMessages
  )
  const getIndividualMsg = async (message: any) => {
    try {
      let messageRes = await qortalRequest({
        action: 'FETCH_QDN_RESOURCE',
        name: message.name,
        service: MAIL_SERVICE_TYPE,
        identifier: message.identifier,
        encoding: 'base64'
      })
      let requestEncryptBody: any = {
        action: 'DECRYPT_DATA',
        encryptedData: messageRes
      }
      const resDecrypt = await qortalRequest(requestEncryptBody)
      const decryptToUnit8ArrayMessage = base64ToUint8Array(resDecrypt)
      const responseDataMessage = uint8ArrayToObject(decryptToUnit8ArrayMessage)

      const fullObject = {
        ...message,
        ...(responseDataMessage || {}),
        id: message.identifier
      }
      dispatch(addToHashMapMail(fullObject))
    } catch (error) {}
  }
  const getMailMessages = React.useCallback(
    async (groupInfo: any, reset?: boolean) => {
      try {
        dispatch(setIsLoadingCustom('Loading messages'))
        let str = groupInfo.threadId
        let parts = str.split('_').reverse()
        let result = parts[0]
        const threadId = result
        const offset = messages.length
        const query = `qortal_qmail_thmsg_group${groupInfo?.threadData?.groupId}_${threadId}`
        const url = `/arbitrary/resources/search?mode=ALL&service=${MAIL_SERVICE_TYPE}&query=${query}&limit=20&includemetadata=false&offset=${offset}&reverse=true&excludeblocked=true`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const responseData = await response.json()
        let fullArrayMsg = reset ? [] : [...messages]
        let newMessages: any[] = []
        for (const message of responseData) {
          const index = fullArrayMsg.findIndex(
            (p) => p.identifier === message.identifier
          )
          if (index !== -1) {
            fullArrayMsg[index] = message
          } else {
            fullArrayMsg.push(message)
            getIndividualMsg(message)
          }
        }
        setMessages(fullArrayMsg)
      } catch (error) {
      } finally {
        dispatch(setIsLoadingCustom(null))
      }
    },
    [messages]
  )
  const getMessages = React.useCallback(async () => {
    if (!user?.name || !currentThread) return
    await getMailMessages(currentThread, true)
  }, [getMailMessages, user, currentThread])
  const firstMount = useRef(false)
  useEffect(() => {
    if (user?.name && currentThread) {
      getMessages()
      firstMount.current = true
    }
  }, [user, currentThread])
  const messageCallback = useCallback((msg: any) => {
    dispatch(addToHashMapMail(msg))
    setMessages((prev) => [msg, ...prev])
  }, [])

  const interval = useRef<any>(null)

  const checkNewMessages = React.useCallback(
    async (groupInfo: any) => {
      try {
        let str = groupInfo.threadId
        let parts = str.split('_').reverse()
        let result = parts[0]
        const threadId = result
        const query = `qortal_qmail_thmsg_group${groupInfo?.threadData?.groupId}_${threadId}`
        const url = `/arbitrary/resources/search?mode=ALL&service=${MAIL_SERVICE_TYPE}&query=${query}&limit=20&includemetadata=false&offset=${0}&reverse=true&excludeblocked=true`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const responseData = await response.json()
        const latestMessage = messages[0]
        if (!latestMessage) return
        const findMessage = responseData?.findIndex(
          (item: any) => item?.identifier === latestMessage?.identifier
        )
        let sliceLength = responseData.length
        if (findMessage !== -1) {
          sliceLength = findMessage
        }
        const newArray = responseData.slice(0, findMessage).reverse()
        let fullArrayMsg = [...messages]
        for (const message of newArray) {
          try {
            let messageRes = await qortalRequest({
              action: 'FETCH_QDN_RESOURCE',
              name: message.name,
              service: MAIL_SERVICE_TYPE,
              identifier: message.identifier,
              encoding: 'base64'
            })
            let requestEncryptBody: any = {
              action: 'DECRYPT_DATA',
              encryptedData: messageRes
            }
            const resDecrypt = await qortalRequest(requestEncryptBody)
            const decryptToUnit8ArrayMessage = base64ToUint8Array(resDecrypt)
            const responseDataMessage = uint8ArrayToObject(
              decryptToUnit8ArrayMessage
            )

            const fullObject = {
              ...message,
              ...(responseDataMessage || {}),
              id: message.identifier
            }
            dispatch(addToHashMapMail(fullObject))
            const index = messages.findIndex(
              (p) => p.identifier === fullObject.identifier
            )
            if (index !== -1) {
              fullArrayMsg[index] = fullObject
            } else {
              fullArrayMsg.unshift(fullObject)
            }
          } catch (error) {}
        }
        setMessages(fullArrayMsg)
      } catch (error) {
      } finally {
      }
    },
    [messages]
  )

  const checkNewMessagesFunc = useCallback(() => {
    if (!user?.name || !user?.address) return
    let isCalling = false
    interval.current = setInterval(async () => {
      if (isCalling || !user?.name || !user?.address) return
      isCalling = true
      const res = await checkNewMessages(currentThread)
      isCalling = false
    }, 8000)
  }, [checkNewMessages, user, currentThread])

  useEffect(() => {
    checkNewMessagesFunc()
    return () => {
      if (interval?.current) {
        clearInterval(interval.current)
      }
    }
  }, [checkNewMessagesFunc])

  if (!currentThread) return null
  return (
    <div
      style={{
        // backgroundColor: theme.palette.background.paper,
        width: '100%',
        // minHeight: '100%',
        // overflow: 'auto'
      }}
      // className="threadScroller"
    >
      {/* <Box
        sx={{
          display: 'flex',
          gap: '20px',
          margin: '2px 10px 10px 10px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Button
          sx={{
            height: '45px'
          }}
          variant="contained"
          onClick={() => {
            setMessages([])
            closeThread()
          }}
        >
          Close Thread
        </Button>
        <NewThread
          groupInfo={groupInfo}
          isMessage={true}
          currentThread={currentThread}
          messageCallback={messageCallback}
          members={members}
        />
      </Box> */}
       <NewThread
          groupInfo={groupInfo}
          isMessage={true}
          currentThread={currentThread}
          messageCallback={messageCallback}
          members={members}
        />
      <ThreadContainerFullWidth>
      <ThreadContainer>
      <Spacer height="60px" />
          <Box sx={{
            width: '100%',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
          <GroupNameP>{currentThread?.threadData?.title}</GroupNameP>

          <ShowMessageReturnButton onClick={() => {
                    setMessages([])
                    closeThread()
                  }}>
                    <MailIconImg src={ReturnSVG} />
                    <ComposeP>Return to Threads</ComposeP>
                  </ShowMessageReturnButton>
          </Box>
          <Spacer height="60px" />
          {messages.map((message) => {
        let fullMessage = message

        if (hashMapMailMessages[message?.identifier]) {
          fullMessage = hashMapMailMessages[message.identifier]
          return <ShowMessage key={message?.identifier} message={fullMessage} />
        }

        return (
          <SingleThreadParent>
            
              <Skeleton
                variant="rectangular"
                style={{
                  width: '100%',
                  height: 60,
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              />
           
            </SingleThreadParent>
        )
      })}
    </ThreadContainer>
      </ThreadContainerFullWidth>
    
      {messages.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            maxWidth: '100%'
          }}
        >
          <Button
            variant="contained"
            onClick={() => getMailMessages(currentThread)}
          >
            Load older messages
          </Button>
        </Box>
      )}
    </div>
  )
}
