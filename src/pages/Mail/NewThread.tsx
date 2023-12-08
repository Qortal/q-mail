import React, { Dispatch, useEffect, useState } from 'react'
import { ReusableModal } from '../../components/modals/ReusableModal'
import { Box, Button, Input, Typography, useTheme } from '@mui/material'
import { BuilderButton } from '../CreatePost/CreatePost-styles'
import BlogEditor from '../../components/editor/BlogEditor'
import EmailIcon from '@mui/icons-material/Email'
import { Descendant } from 'slate'
import ShortUniqueId from 'short-unique-id'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../state/store'
import { useDropzone } from 'react-dropzone'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import CreateIcon from '@mui/icons-material/Create'
import { setNotification } from '../../state/features/notificationsSlice'
import { useNavigate, useLocation } from 'react-router-dom'

import {
  objectToBase64,
  objectToUint8Array,
  objectToUint8ArrayFromResponse,
  processFileInChunks,
  toBase64,
  uint8ArrayToBase64
} from '../../utils/toBase64'
import {
  MAIL_ATTACHMENT_SERVICE_TYPE,
  MAIL_SERVICE_TYPE
} from '../../constants/mail'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import useConfirmationModal from '../../hooks/useConfirmModal'
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
]
const uid = new ShortUniqueId()

interface NewMessageProps {
  hideButton?: boolean
  groupInfo: any
  currentThread?: any
  isMessage?: boolean
  messageCallback?: (val: any) => void
  refreshLatestThreads?: () => void
}
const maxSize = 25 * 1024 * 1024 // 25 MB in bytes
export const NewThread = ({
  groupInfo,
  hideButton,
  currentThread,
  isMessage = false,
  messageCallback,
  refreshLatestThreads
}: NewMessageProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [value, setValue] = useState(initialValue)
  const [title, setTitle] = useState<string>('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [subject, setSubject] = useState<string>('')
  const [threadTitle, setThreadTitle] = useState<string>('')
  const [destinationName, setDestinationName] = useState('')
  const { user } = useSelector((state: RootState) => state.auth)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const theme = useTheme()

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { getRootProps, getInputProps } = useDropzone({
    maxSize,
    onDrop: (acceptedFiles) => {
      setAttachments((prev) => [...prev, ...acceptedFiles])
    },
    onDropRejected: (rejectedFiles) => {
      dispatch(
        setNotification({
          msg: 'One of your files is over the 25mb limit',
          alertType: 'error'
        })
      )
    }
  })

  const openModal = () => {
    setIsOpen(true)
  }
  const closeModal = () => {
    setAttachments([])
    setSubject('')
    setDestinationName('')
    setValue(initialValue)
    setIsOpen(false)
  }

  async function publishQDNResource() {
    let name: string = ''
    let errorMsg = ''

    name = user?.name || ''

    const missingFields: string[] = []

    if (!isMessage && !threadTitle) {
      errorMsg = 'Please provide a thread title'
    }

    if (!name) {
      errorMsg = 'Cannot send a message without a access to your name'
    }
    if (!groupInfo) {
      errorMsg = 'Cannot access group information'
    }

    // if (!description) missingFields.push('subject')
    if (missingFields.length > 0) {
      const missingFieldsString = missingFields.join(', ')
      const errMsg = `Missing: ${missingFieldsString}`
      errorMsg = errMsg
    }

    if (errorMsg) {
      dispatch(
        setNotification({
          msg: errorMsg,
          alertType: 'error'
        })
      )
      throw new Error(errorMsg)
    }

    const mailObject: any = {
      subject,
      createdAt: Date.now(),
      version: 1,
      attachments,
      textContent: value,
      name,
      threadOwner: currentThread?.threadData?.name || name
    }

    try {
      const groupPublicKeys = Object.keys(groupInfo?.members)?.map(
        (key: any) => groupInfo.members[key]?.publicKey
      )
      if (!groupPublicKeys || groupPublicKeys?.length === 0) {
        throw new Error('No members in this group could be found')
      }

      // START OF ATTACHMENT LOGIC

      const attachmentArray: any[] = []
      for (const attachment of attachments) {
        const fileBase64 = await toBase64(attachment)
        if (typeof fileBase64 !== 'string' || !fileBase64)
          throw new Error('Could not convert file to base64')
        const base64String = fileBase64.split(',')[1]

        const id = uid()
        const id2 = uid()
        const identifier = `attachments_qmail_${id}_${id2}`
        const fileExtension = attachment?.name?.split('.')?.pop()
        if (!fileExtension) {
          throw new Error('One of your attachments does not have an extension')
        }
        const obj = {
          name: name,
          service: MAIL_ATTACHMENT_SERVICE_TYPE,
          filename: `${id}.${fileExtension}`,
          originalFilename: attachment?.name || '',
          identifier,
          data64: base64String
        }

        attachmentArray.push(obj)
      }

      if (attachmentArray?.length > 0) {
        mailObject.attachments = attachmentArray.map((item) => {
          return {
            identifier: item.identifier,
            name,
            service: MAIL_ATTACHMENT_SERVICE_TYPE,
            filename: item.filename,
            originalFilename: item.originalFilename
          }
        })

        const multiplePublish = {
          action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
          resources: [...attachmentArray],
          encrypt: true,
          publicKeys: groupPublicKeys
        }
        await qortalRequest(multiplePublish)
      }

      //END OF ATTACHMENT LOGIC
      if (!isMessage) {
        const idThread = uid()
        const messageToBase64 = await objectToBase64(mailObject)
        const threadObject = {
          title: threadTitle,
          groupId: groupInfo.id,
          createdAt: Date.now(),
          name
        }
        const threadToBase64 = await objectToBase64(threadObject)
        let identifierThread = `qortal_qmail_thread_group${groupInfo.id}_${idThread}`
        let requestBodyThread: any = {
          name: name,
          service: MAIL_SERVICE_TYPE,
          data64: threadToBase64,
          identifier: identifierThread
        }
        const idMsg = uid()
        let groupIndex = identifierThread.indexOf('group')
        let result = identifierThread.substring(groupIndex)
        let identifier = `qortal_qmail_thmsg_${result}_${idMsg}`
        let requestBody: any = {
          name: name,
          service: MAIL_SERVICE_TYPE,
          data64: messageToBase64,
          identifier
        }
        const multiplePublishMsg = {
          action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
          resources: [requestBody, requestBodyThread],
          encrypt: true,
          publicKeys: groupPublicKeys
        }
        await qortalRequest(multiplePublishMsg)
        dispatch(
          setNotification({
            msg: 'Message sent',
            alertType: 'success'
          })
        )
        if (refreshLatestThreads) {
          refreshLatestThreads()
        }
        closeModal()
      } else {
        if (!currentThread) throw new Error('unable to locate thread Id')
        const idThread = currentThread.threadId
        const messageToBase64 = await objectToBase64(mailObject)
        const idMsg = uid()
        let groupIndex = idThread.indexOf('group')
        let result = idThread.substring(groupIndex)
        let identifier = `qortal_qmail_thmsg_${result}_${idMsg}`
        let requestBody: any = {
          name: name,
          service: MAIL_SERVICE_TYPE,
          data64: messageToBase64,
          identifier
        }
        const multiplePublishMsg = {
          action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
          resources: [requestBody],
          encrypt: true,
          publicKeys: groupPublicKeys
        }
        await qortalRequest(multiplePublishMsg)
        dispatch(
          setNotification({
            msg: 'Message sent',
            alertType: 'success'
          })
        )
        if (messageCallback) {
          messageCallback({
            identifier,
            id: identifier,
            name,
            service: MAIL_SERVICE_TYPE,
            created: Date.now(),
            ...mailObject
          })
        }

        closeModal()
      }
    } catch (error: any) {
      let notificationObj = null
      if (typeof error === 'string') {
        notificationObj = {
          msg: error || 'Failed to send message',
          alertType: 'error'
        }
      } else if (typeof error?.error === 'string') {
        notificationObj = {
          msg: error?.error || 'Failed to send message',
          alertType: 'error'
        }
      } else {
        notificationObj = {
          msg: error?.message || 'Failed to send message',
          alertType: 'error'
        }
      }
      if (!notificationObj) return
      dispatch(setNotification(notificationObj))

      throw new Error('Failed to send message')
    }
  }

  const sendMail = () => {
    publishQDNResource()
  }
  return (
    <Box
      sx={{
        display: 'flex'
      }}
    >
      {!hideButton && (
        <Box
          className="step-2"
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: theme.palette.background.default,
            borderRadius: '25px',
            height: 'auto',
            padding: '10px',
            cursor: 'pointer',
            margin: '7px 10px 7px 0px;'
          }}
          onClick={openModal}
        >
          <CreateIcon
            sx={{
              cursor: 'pointer',
              marginRight: '5px'
            }}
          />
          <Typography
            sx={{
              fontSize: '14px'
            }}
          >
            {isMessage ? 'New Message' : 'New Thread'}
          </Typography>
        </Box>
      )}

      <ReusableModal
        open={isOpen}
        customStyles={{
          maxHeight: '95vh',
          overflowY: 'auto'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              flexDirection: 'column',
              gap: 2,
              width: '100%'
            }}
          >
            {!isMessage && (
              <Input
                id="standard-adornment-name"
                value={threadTitle}
                onChange={(e) => {
                  setThreadTitle(e.target.value)
                }}
                placeholder="New Thread Title"
                sx={{
                  width: '100%',
                  fontSize: '16px'
                }}
              />
            )}

            <Box
              {...getRootProps()}
              sx={{
                border: '1px dashed gray',
                padding: 2,
                textAlign: 'center',
                marginBottom: 2
              }}
            >
              <input {...getInputProps()} />
              <AttachFileIcon
                sx={{
                  height: '20px',
                  width: 'auto',
                  cursor: 'pointer'
                }}
              ></AttachFileIcon>
            </Box>
            <Box>
              {attachments.map((file, index) => {
                return (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '16px'
                      }}
                    >
                      {file?.name}
                    </Typography>
                    <CloseIcon
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((item, itemIndex) => itemIndex !== index)
                        )
                      }
                      sx={{
                        height: '16px',
                        width: 'auto',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                )
              })}
            </Box>
          </Box>
          <BlogEditor
            mode="mail"
            value={value}
            setValue={setValue}
            editorKey={1}
            disableMaxHeight
          />
        </Box>
        <BuilderButton onClick={sendMail}>{'Post message'}</BuilderButton>
        <BuilderButton onClick={closeModal}>Close</BuilderButton>
      </ReusableModal>
    </Box>
  )
}
