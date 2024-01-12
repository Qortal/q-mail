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
import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, CircularProgress, Input, Typography, useTheme } from '@mui/material'
import { useFetchPosts } from '../../hooks/useFetchPosts'
import LazyLoad from '../../components/common/LazyLoad'
import { removePrefix } from '../../utils/blogIdformats'
import { NewMessage } from './NewMessage'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useFetchMail } from '../../hooks/useFetchMail'
import { ShowMessage } from './ShowMessage'
import { addToHashMapMail } from '../../state/features/mailSlice'
import {
  setIsLoadingGlobal,
  setUserAvatarHash
} from '../../state/features/globalSlice'
import SimpleTable from './MailTable'
import { MAIL_SERVICE_TYPE } from '../../constants/mail'
import { BlogPost } from '../../state/features/blogSlice'
import { setNotification } from '../../state/features/notificationsSlice'
import { useModal } from '../../components/common/useModal'
import { OpenMail } from './OpenMail'
import { MessagesContainer } from './Mail-styles'
import { MailMessageRow } from './MailMessageRow'

interface SentMailProps {
  onOpen: (user: string, identifier: string, content: any, to?:string)=> Promise<void>
}
export const SentMail = ({onOpen}: SentMailProps) => {
  const {isShow, onCancel, onOk, show} = useModal()

  const theme = useTheme()
  const { user } = useSelector((state: RootState) => state.auth)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<any>(null)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [valueTab, setValueTab] = React.useState(0)
  const [aliasValue, setAliasValue] = useState('')
  const [alias, setAlias] = useState<string[]>([])
  const [mailInfo, setMailInfo] = useState<any>(null)
  const hashMapPosts = useSelector(
    (state: RootState) => state.blog.hashMapPosts
  )
  const [mailMessages, setMailMessages] = useState<any[]>([])
  const hashMapMailMessages = useSelector(
    (state: RootState) => state.mail.hashMapMailMessages
  )

  const fullMailMessages = useMemo(() => {
    return mailMessages.map((msg) => {
      let message = msg
      const existingMessage = hashMapMailMessages[msg.id]
      if (existingMessage) {
        message = existingMessage
      }
      return message
    })
  }, [mailMessages, hashMapMailMessages, user])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const getAvatar = async (user: string) => {
    try {
      let url = await qortalRequest({
        action: 'GET_QDN_RESOURCE_URL',
        name: user,
        service: 'THUMBNAIL',
        identifier: 'qortal_avatar'
      })
      dispatch(
        setUserAvatarHash({
          name: user,
          url
        })
      )
    } catch (error) {}
  }

  const checkNewMessages = React.useCallback(
    async (recipientName: string, recipientAddress: string) => {
      try {
        if (!user?.name) return
        const query = `_mail_qortal_qmail_`
        const url = `/arbitrary/resources/search?mode=ALL&service=${MAIL_SERVICE_TYPE}&identifier=_mail_&query=${query}&name=${user?.name}&limit=20&includemetadata=true&reverse=true&excludeblocked=true`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const responseData = await response.json()

        const latestPost = mailMessages[0]
        if (!latestPost) return
        const findPost = responseData?.findIndex(
          (item: any) => item?.identifier === latestPost?.id
        )
        if (findPost === -1) {
          return
        }
        const newArray = responseData.slice(0, findPost)
        const structureData = newArray.map((post: any): BlogPost => {
          return {
            title: post?.metadata?.title,
            category: post?.metadata?.category,
            categoryName: post?.metadata?.categoryName,
            tags: post?.metadata?.tags || [],
            description: post?.metadata?.description,
            createdAt: post?.created,
            updated: post?.updated,
            user: post.name,
            id: post.identifier
          }
        })
        setMailMessages((prev) => {
          const updatedMessages = [...prev]

          structureData.forEach((newMessage: any) => {
            const existingIndex = updatedMessages.findIndex(
              (prevMessage) => prevMessage.id === newMessage.id
            )

            if (existingIndex !== -1) {
              // Replace existing message
              updatedMessages[existingIndex] = newMessage
            } else {
              // Add new message
              updatedMessages.unshift(newMessage)
            }
          })

          return updatedMessages
        })
        return
      } catch (error) {}
    },
    [mailMessages]
  )

  const getMailMessages = React.useCallback(
    async (recipientName: string, recipientAddress: string) => {
      try {
        if (!user?.name) return
        const offset = mailMessages.length

        // dispatch(setIsLoadingGlobal(true))
        const query = `_mail_qortal_qmail_`
        const url = `/arbitrary/resources/search?mode=ALL&service=${MAIL_SERVICE_TYPE}&identifier=_mail_&query=${query}&name=${user.name}&limit=20&includemetadata=true&offset=${offset}&reverse=true&excludeblocked=true`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const responseData = await response.json()
        const structureData = responseData.map((post: any): BlogPost => {
          return {
            title: post?.metadata?.title,
            category: post?.metadata?.category,
            categoryName: post?.metadata?.categoryName,
            tags: post?.metadata?.tags || [],
            description: post?.metadata?.description,
            createdAt: post?.created,
            updated: post?.updated,
            user: post.name,
            id: post.identifier
          }
        })
        setMailMessages((prev) => {
          const updatedMessages = [...prev]

          structureData.forEach((newMessage: any) => {
            const existingIndex = updatedMessages.findIndex(
              (prevMessage) => prevMessage.id === newMessage.id
            )

            if (existingIndex !== -1) {
              // Replace existing message
              updatedMessages[existingIndex] = newMessage
            } else {
              // Add new message
              updatedMessages.push(newMessage)
            }
          })

          return updatedMessages
        })

        for (const content of structureData) {
          if (content.user && content.id) {
            getAvatar(content.user)
          }
        }
      } catch (error) {
      } finally {
        // dispatch(setIsLoadingGlobal(false))
      }
    },
    [mailMessages, hashMapMailMessages, user]
  )
  const getMessages = React.useCallback(async (isOnMount?: boolean) => {
    if (!user?.name || !user?.address) return;
    try {
      if (isOnMount) {
        setIsLoading(true);
      }
      await getMailMessages(user.name, user.address);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [getMailMessages, user])

  const firstMount = useRef(false);
  useEffect(() => {
    if (user?.name && !firstMount.current) {
      getMessages(true);
      firstMount.current = true;
    }
  }, [user]);

  const interval = useRef<any>(null)

  const checkNewMessagesFunc = useCallback(() => {
    if (!user?.name || !user?.address) return
    let isCalling = false
    interval.current = setInterval(async () => {
      if (isCalling || !user?.name || !user?.address) return
      isCalling = true
      const res = await checkNewMessages(user?.name, user.address)
      isCalling = false
    }, 30000)
  }, [checkNewMessages, user])

  useEffect(() => {
    checkNewMessagesFunc()
    return () => {
      if (interval?.current) {
        clearInterval(interval.current)
      }
    }
  }, [checkNewMessagesFunc])


 

  const openMessage = async (
    user: string,
    messageIdentifier: string,
    content: any,
    to?: string
  ) => {
    try {
      onOpen(user, messageIdentifier, {}, to)
   
    } finally {
    }
  }

  return (
    <>
     {mailInfo && isShow && (
              <OpenMail open={isShow} handleClose={onOk} fileInfo={mailInfo}/>
      )}
      {/* <NewMessage replyTo={replyTo} setReplyTo={setReplyTo} hideButton /> */}
      <ShowMessage
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        message={message}
        setReplyTo={setReplyTo}
      />
       <MessagesContainer>
                {fullMailMessages.map(item => {
                  return (
                    <MailMessageRow
                      messageData={item}
                      openMessage={openMessage}
                      isFromSent
                    />
                  );
                })}
                <LazyLoad onLoadMore={getMessages}></LazyLoad>
                {isLoading && (
                      <Box sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'center'
                      }}>
                        <CircularProgress />
                      </Box>
                    )}
              </MessagesContainer>
      {/* <SimpleTable
        openMessage={openMessage}
        data={fullMailMessages}
      ></SimpleTable>
      <LazyLoad onLoadMore={getMessages}></LazyLoad> */}
    </>
  )
}
