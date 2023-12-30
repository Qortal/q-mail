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
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import mime from 'mime';

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
import { MultiplePublish } from '../../components/common/MultiplePublish/MultiplePublish'
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
]
const uid = new ShortUniqueId()

interface NewMessageProps {
  replyTo?: any
  setReplyTo: React.Dispatch<any>
  alias?: string
  hideButton?: boolean
  isFromTo?: boolean
}
const maxSize = 40 * 1024 * 1024 // 40 MB in bytes
export const NewMessage = ({
  setReplyTo,
  replyTo,
  alias,
  hideButton,
  isFromTo
}: NewMessageProps) => {
  const { name } = useParams()
  const [publishes, setPublishes] = useState<any>(null);
  const [isOpenMultiplePublish, setIsOpenMultiplePublish] = useState(false);
  const [isFromToName, setIsFromToName] = useState<null | string>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [value, setValue] = useState(initialValue)
  const [title, setTitle] = useState<string>('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [description, setDescription] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [destinationName, setDestinationName] = useState('')
  const [aliasValue, setAliasValue] = useState<string>('')
  const { user } = useSelector((state: RootState) => state.auth)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [showAlias, setShowAlias] = useState<boolean>(false)
  const theme = useTheme()
  const { Modal, showModal } = useConfirmationModal({
    title: 'Important',
    message:
      'To keep yourself anonymous remember to not use the same alias as the person you are messaging'
  })
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { getRootProps, getInputProps } = useDropzone({
    maxSize,
    onDrop: async (acceptedFiles) => {

      let files: any[] = []
      try {
        acceptedFiles.forEach((item)=> {
          const type = item?.type
          if(!type){
            files.push({
              file: item,
              mimetype: null,
              extension: null
            })
          } else {
            const extension = mime.getExtension(type); 
            if(!extension){
              files.push({
                file: item,
                mimetype: type,
                extension: null
              })
            } else {
              files.push({
                file: item,
                mimetype: type,
                extension: extension
              })
            }
            
          }
        })
      } catch (error) {
        dispatch(
          setNotification({
            msg: 'One of your files is corrupted',
            alertType: 'error'
          })
        )
      }
      setAttachments((prev) => [...prev, ...files])
    },
    onDropRejected: (rejectedFiles) => {
      dispatch(
        setNotification({
          msg: 'One of your files is over the 40mb limit',
          alertType: 'error'
        })
      )
    }
  })

  console.log({attachments})

  const openModal = () => {
    setIsOpen(true)

    setReplyTo(null)
  }
  const closeModal = () => {
    setAttachments([])
    setSubject('')
    setDestinationName('')
    setShowAlias(false)
    setValue(initialValue)
    setReplyTo(null)
    setIsOpen(false)
    setAliasValue('')
  }

  useEffect(() => {
    if (isFromTo && name) {
      setIsFromToName(name)
    }
  }, [isFromTo, name])

  useEffect(() => {
    if (!isFromToName) return
    setDestinationName(isFromToName)
    setIsOpen(true)
    setIsFromToName(null)
  }, [isFromToName])

  useEffect(() => {
    if (replyTo) {
      setIsOpen(true)
      setDestinationName(replyTo?.user || '')
    }
  }, [replyTo])

  const waitForUserAction = async () => {
    return new Promise<void>((resolve, reject) => {
      setIsModalOpen(true)

      const handleConfirm = () => {
        setIsModalOpen(false)
        resolve()
      }

      const handleCancel = () => {
        setIsModalOpen(false)
        reject(new Error('User canceled'))
      }

      const modalProps = {
        open: isModalOpen,
        title: 'Confirmation',
        message: 'Are you sure?',
        handleConfirm,
        handleCancel
      }

      return <ConfirmationModal {...modalProps} />
    })
  }
  async function publishQDNResource() {
    let address: string = ''
    let name: string = ''
    let errorMsg = ''

    address = user?.address || ''
    name = user?.name || ''

    const missingFields: string[] = []
    if (!address) {
      errorMsg = "Cannot send: your address isn't available"
    }
    if (!name) {
      errorMsg = 'Cannot send a message without a access to your name'
    }
    if (!destinationName) {
      errorMsg = 'Cannot send a message without a recipient name'
    }
    // if (!description) missingFields.push('subject')
    if (missingFields.length > 0) {
      const missingFieldsString = missingFields.join(', ')
      const errMsg = `Missing: ${missingFieldsString}`
      errorMsg = errMsg
    }

    if (alias && !aliasValue) {
      errorMsg = 'An alias is required when inside an alias tab'
    }
    if (alias && alias === aliasValue) {
      errorMsg = "The recipient's alias cannot be the same as yours"
    }
    const noExtension = attachments.filter(item=> !item.extension)
    if(noExtension.length > 0){
      errorMsg = "One of your attachments does not have an extension (example: .png, .pdf, ect...)"
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
    
    if (aliasValue && !alias) {
      const userConfirmed = await showModal()
      if (userConfirmed === false) return
    }
    const mailObject: any = {
      title,
      // description,
      subject,
      createdAt: Date.now(),
      version: 1,
      attachments,
      textContent: value,
      generalData: {
        thread: []
      },
      recipient: destinationName
    }
    if (replyTo?.id) {
      const previousTread = Array.isArray(replyTo?.generalData?.thread)
        ? replyTo?.generalData?.thread
        : []
      mailObject.generalData.thread = [
        ...previousTread,
        {
          identifier: replyTo.id,
          name: replyTo.user,
          service: MAIL_SERVICE_TYPE
        }
      ]
    }

    try {
      if (!destinationName) return
      const id = uid()
      const recipientName = destinationName
      const resName = await qortalRequest({
        action: 'GET_NAME_DATA',
        name: recipientName
      })
      if (!resName?.owner) return

      const recipientAddress = resName.owner
      const resAddress = await qortalRequest({
        action: 'GET_ACCOUNT_DATA',
        address: recipientAddress
      })
      if (!resAddress?.publicKey) return
      const recipientPublicKey = resAddress.publicKey

      // START OF ATTACHMENT LOGIC

      const attachmentArray = []
      for (const singleAttachment of attachments) {
        const attachment = singleAttachment.file
        const fileBase64 = await toBase64(attachment)
        if (typeof fileBase64 !== 'string' || !fileBase64)
          throw new Error('Could not convert file to base64')
        const base64String = fileBase64.split(',')[1]

        const id = uid()
        const id2 = uid()
        const identifier = `attachments_qmail_${id}_${id2}`
        let fileExtension = attachment?.name?.split('.')?.pop()
        if (!fileExtension) {
          fileExtension = singleAttachment.extension
        }
        const obj = {
          name: name,
          service: MAIL_ATTACHMENT_SERVICE_TYPE,
          filename: `${id}.${fileExtension}`,
          originalFilename: attachment?.name || '',
          identifier,
          data64: base64String,
          type: attachment?.type
        }

        attachmentArray.push(obj)
      }

      const listOfPublishes = [...attachmentArray]
      if (attachmentArray?.length > 0) {
        mailObject.attachments = attachmentArray.map((item) => {
          return {
            identifier: item.identifier,
            name,
            service: MAIL_ATTACHMENT_SERVICE_TYPE,
            filename: item.filename,
            originalFilename: item.originalFilename,
            type: item?.type
          }
        })

        // const multiplePublish = {
        //   action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
        //   resources: [...attachmentArray],
        //   encrypt: true,
        //   publicKeys: [recipientPublicKey]
        // }
        // await qortalRequest(multiplePublish)
      }

      //END OF ATTACHMENT LOGIC

      const blogPostToBase64 = await objectToBase64(mailObject)
      let identifier = `qortal_qmail_${recipientName.slice(
        0,
        20
      )}_${recipientAddress.slice(-6)}_mail_${id}`

      if (aliasValue) {
        identifier = `qortal_qmail_${aliasValue}_mail_${id}`
      }

      let requestBody: any = {
        action: 'PUBLISH_QDN_RESOURCE',
        name: name,
        service: MAIL_SERVICE_TYPE,
        data64: blogPostToBase64,
        title: title,
        // description: description,
        identifier,
        encrypt: true,
        publicKeys: [recipientPublicKey]
      }

      // await qortalRequest(requestBody)
      const multiplePublish = {
        action: 'PUBLISH_MULTIPLE_QDN_RESOURCES',
        resources: [...listOfPublishes, requestBody],
        encrypt: true,
        publicKeys: [recipientPublicKey]
      };
      setPublishes(multiplePublish);
      setIsOpenMultiplePublish(true);
      // dispatch(
      //   setNotification({
      //     msg: 'Message sent',
      //     alertType: 'success'
      //   })
      // )

      // closeModal()
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
            Compose
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
            <Input
              id="standard-adornment-name"
              value={destinationName}
              onChange={(e) => {
                setDestinationName(e.target.value)
              }}
              placeholder="To (name)"
              sx={{
                width: '100%',
                fontSize: '16px'
              }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%'
              }}
            >
              {(alias || showAlias) && (
                <Input
                  id="standard-adornment-alias"
                  value={aliasValue}
                  onChange={(e) => {
                    setAliasValue(e.target.value)
                  }}
                  placeholder={`Alias ${alias ? '' : '-optional'}`}
                  sx={{
                    width: '100%',
                    fontSize: '16px'
                  }}
                />
              )}
              {!alias && !showAlias && (
                <Button
                  onClick={() => setShowAlias(true)}
                  size="small"
                  variant="contained"
                  sx={{
                    textTransform: 'none'
                  }}
                >
                  Add Alias - optional
                </Button>
              )}
            </Box>

            <Input
              id="standard-adornment-name"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
              }}
              placeholder="Subject"
              sx={{
                width: '100%',
                fontSize: '16px'
              }}
            />
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
              {attachments.map(({file, extension}, index) => {
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
                        fontSize: '16px',
                        color: !extension ? 'red' : 'unset'
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
                    {!extension && (
                        <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'red'
                        }}
                      >
                        This file has no extension
                      </Typography>
                    )}
                  
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
        <BuilderButton onClick={sendMail}>
          {replyTo ? 'Send reply mail' : 'Send mail'}
        </BuilderButton>
        <BuilderButton onClick={closeModal}>Close</BuilderButton>
      </ReusableModal>
      <Modal />
      {isOpenMultiplePublish && (
        <MultiplePublish
          isOpen={isOpenMultiplePublish}
          onSubmit={() => {
            dispatch(
              setNotification({
                msg: 'Message sent',
                alertType: 'success'
              })
            )
            setIsOpenMultiplePublish(false);
            setPublishes(null)
            closeModal()
          }}
          publishes={publishes}
        />
      )}
    </Box>
  )
}
