import * as React from 'react'
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import { MyContext } from '../wrappers/DownloadWrapper'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { CircularProgress } from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import {
  setCurrAudio,
  setShowingAudioPlayer
} from '../state/features/globalSlice'
import {
  base64ToUint8Array,
  objectToUint8ArrayFromResponse
} from '../utils/toBase64'
import { setNotification } from '../state/features/notificationsSlice'

const Widget = styled('div')(({ theme }) => ({
  padding: 8,
  borderRadius: 10,
  maxWidth: 350,
  position: 'relative',
  zIndex: 1,
  //   backgroundColor:
  //     theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
  backdropFilter: 'blur(40px)',
  background: 'skyblue',
  transition: '0.2s all',
  '&:hover': {
    opacity: 0.75
  }
}))

const CoverImage = styled('div')({
  width: 40,
  height: 40,
  objectFit: 'cover',
  overflow: 'hidden',
  flexShrink: 0,
  borderRadius: 8,
  backgroundColor: 'rgba(0,0,0,0.08)',
  '& > img': {
    width: '100%'
  }
})

const TinyText = styled(Typography)({
  fontSize: '0.75rem',
  opacity: 0.38,
  fontWeight: 500,
  letterSpacing: 0.2
})

interface IAudioElement {
  title: string
  description?: string
  author?: string
  fileInfo?: any
  postId?: string
  user?: string
  children?: React.ReactNode
  mimeType?: string
  disable?: boolean
  mode?: string
  otherUser?: string
}

interface CustomWindow extends Window {
  showSaveFilePicker: any // Replace 'any' with the appropriate type if you know it
}

const customWindow = window as unknown as CustomWindow

export default function FileElement({
  title,
  description,
  author,
  fileInfo,
  postId = '',
  user,
  children,
  mimeType,
  disable,
  mode,
  otherUser
}: IAudioElement) {
  const { downloadVideo } = React.useContext(MyContext)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [fileProperties, setFileProperties] = React.useState<any>(null)
  const [downloadLoader, setDownloadLoader] = React.useState<any>(false)

  const [pdfSrc, setPdfSrc] = React.useState('')
  const { downloads } = useSelector((state: RootState) => state.global)
  const { user: username } = useSelector((state: RootState) => state.auth)
  const hasCommencedDownload = React.useRef(false)
  const dispatch = useDispatch()
  const download = React.useMemo(() => {
    if (!downloads || !fileInfo?.identifier) return {}
    const findDownload = downloads[fileInfo?.identifier]

    if (!findDownload) return {}
    return findDownload
  }, [downloads, fileInfo])

  const resourceStatus = React.useMemo(() => {
    return download?.status || {}
  }, [download])
  const saveFileToDisk = async (blob: any, fileName: any) => {
    try {
      const fileHandle = await customWindow.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'File'
          }
        ]
      })
      const writeFile = async (fileHandle: any, contents: any) => {
        const writable = await fileHandle.createWritable()
        await writable.write(contents)
        await writable.close()
      }
      writeFile(fileHandle, blob).then(() => console.log('FILE SAVED'))
    } catch (error) {
      console.log(error)
    }
  }
  const handlePlay = async () => {
    if (disable) return
    hasCommencedDownload.current = true
    if (
      resourceStatus?.status === 'READY' &&
      download?.url &&
      download?.blogPost?.filename
    ) {
      if (downloadLoader) return
      dispatch(
        setNotification({
          msg: 'Saving file... please wait',
          alertType: 'info'
        })
      )
      setDownloadLoader(true)
      try {
        const { name, service, identifier } = fileInfo
        if (mode === 'mail') {
          let res = await qortalRequest({
            action: 'FETCH_QDN_RESOURCE',
            name: name,
            service: service,
            identifier: identifier,
            encoding: 'base64'
          })
          // const toUnit8Array = base64ToUint8Array(res)
          const resName = await qortalRequest({
            action: 'GET_NAME_DATA',
            // change this
            name: otherUser
          })
          if (!resName?.owner)
            throw new Error('Unable to locate details to decrypt file')

          const recipientAddress = resName.owner
          const resAddress = await qortalRequest({
            action: 'GET_ACCOUNT_DATA',
            address: recipientAddress
          })
          if (!resAddress?.publicKey)
            throw new Error('Unable to locate details to decrypt file')
          const recipientPublicKey = resAddress.publicKey
          let requestEncryptBody: any = {
            action: 'DECRYPT_DATA',
            encryptedData: res,
            publicKey: recipientPublicKey
          }
          const resDecrypt = await qortalRequest(requestEncryptBody)

          if (!resDecrypt) throw new Error('Unable to decrypt file')
          const decryptToUnit8Array = base64ToUint8Array(resDecrypt)
          let blob = null
          if (download?.blogPost?.mimeType) {
            blob = new Blob([decryptToUnit8Array], {
              type: download?.blogPost?.mimeType
            })
          } else {
            blob = new Blob([decryptToUnit8Array])
          }

          if (!blob) throw new Error('Unable build file into blob')
          await qortalRequest({
            action: 'SAVE_FILE',
            blob,
            filename:
              download?.blogPost?.originalFilename ||
              download?.blogPost?.filename,
            mimeType: download?.blogPost?.mimeType || ''
          })

          return
        }
        const url = `/arbitrary/${service}/${name}/${identifier}`
        fetch(url)
          .then((response) => response.blob())
          .then(async (blob) => {
            await qortalRequest({
              action: 'SAVE_FILE',
              blob,
              filename: download?.blogPost?.filename,
              mimeType: download?.blogPost?.mimeType || ''
            })
            // saveAs(blob, download?.blogPost?.filename)
          })
          .catch((error) => {
            console.error('Error fetching the video:', error)
            // clearInterval(intervalId)
          })
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
      } finally {
        setDownloadLoader(false)
      }
      return
    }
    if (!postId && mode !== 'mail') return
    const { name, service, identifier } = fileInfo
    let filename = fileProperties?.filename
    let mimeType = fileProperties?.mimeType
    if (!fileProperties) {
      try {
        dispatch(
          setNotification({
            msg: 'Downloading file... please wait',
            alertType: 'info'
          })
        )
        let res = await qortalRequest({
          action: 'GET_QDN_RESOURCE_PROPERTIES',
          name: name,
          service: service,
          identifier: identifier
        })
        setFileProperties(res)
        filename = res?.filename
        mimeType = res?.mimeType
      } catch (error: any) {
        console.log({ error })
        dispatch(
          setNotification({
            msg: error?.message || 'Error with download. Please try again',
            alertType: 'error'
          })
        )
      }
    }
    if (!filename) return

    downloadVideo({
      name,
      service,
      identifier,
      blogPost: {
        postId,
        user,
        audioTitle: title,
        audioDescription: description,
        audioAuthor: author,
        filename,
        mimeType,
        originalFilename: fileInfo?.originalFilename
      }
    })
  }

  React.useEffect(() => {
    if (
      resourceStatus?.status === 'READY' &&
      download?.url &&
      download?.blogPost?.filename &&
      hasCommencedDownload.current
    ) {
      setIsLoading(false)
      dispatch(
        setNotification({
          msg: 'Download completed. Click to save file',
          alertType: 'info'
        })
      )
    }
  }, [resourceStatus, download])

  return (
    <Box
      onClick={handlePlay}
      sx={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {children && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            gap: '7px'
          }}
        >
          {children}{' '}
          {(resourceStatus.status && resourceStatus?.status !== 'READY') ||
          isLoading ? (
            <CircularProgress color="secondary" size={14} />
          ) : resourceStatus?.status === 'READY' ? (
            <>
              <Typography
                sx={{
                  fontSize: '14px'
                }}
              >
                Ready to save: click here
              </Typography>
              {downloadLoader && (
                <CircularProgress color="secondary" size={14} />
              )}
            </>
          ) : null}
        </Box>
      )}
      {!children && (
        <Widget>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CoverImage>
              <AttachFileIcon
                sx={{
                  width: '90%',
                  height: 'auto'
                }}
              />
            </CoverImage>
            <Box sx={{ ml: 1.5, minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
              >
                {author}
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: '16px'
                }}
              >
                <b>{title}</b>
              </Typography>
              <Typography
                noWrap
                letterSpacing={-0.25}
                sx={{
                  fontSize: '14px'
                }}
              >
                {description}
              </Typography>
              {mimeType && (
                <Typography
                  noWrap
                  letterSpacing={-0.25}
                  sx={{
                    fontSize: '12px'
                  }}
                >
                  {mimeType}
                </Typography>
              )}
            </Box>
          </Box>
          {((resourceStatus.status && resourceStatus?.status !== 'READY') ||
            isLoading) && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              justifyContent="center"
              alignItems="center"
              zIndex={4999}
              bgcolor="rgba(0, 0, 0, 0.6)"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '8px',
                borderRadius: '10px'
              }}
            >
              <CircularProgress color="secondary" />
              {resourceStatus && (
                <Typography
                  variant="subtitle2"
                  component="div"
                  sx={{
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  {resourceStatus?.status === 'REFETCHING' ? (
                    <>
                      <>
                        {(
                          (resourceStatus?.localChunkCount /
                            resourceStatus?.totalChunkCount) *
                          100
                        )?.toFixed(0)}
                        %
                      </>

                      <> Refetching in 2 minutes</>
                    </>
                  ) : resourceStatus?.status === 'DOWNLOADED' ? (
                    <>Download Completed: building file...</>
                  ) : resourceStatus?.status !== 'READY' ? (
                    <>
                      {(
                        (resourceStatus?.localChunkCount /
                          resourceStatus?.totalChunkCount) *
                        100
                      )?.toFixed(0)}
                      %
                    </>
                  ) : (
                    <>Download Completed: fetching file...</>
                  )}
                </Typography>
              )}
            </Box>
          )}
          {resourceStatus?.status === 'READY' &&
            download?.url &&
            download?.blogPost?.filename && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                justifyContent="center"
                alignItems="center"
                zIndex={4999}
                bgcolor="rgba(0, 0, 0, 0.6)"
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '10px',
                  padding: '8px',
                  borderRadius: '10px'
                }}
              >
                <Typography
                  variant="subtitle2"
                  component="div"
                  sx={{
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  Ready to save: click here
                </Typography>
                {downloadLoader && (
                  <CircularProgress color="secondary" size={14} />
                )}
              </Box>
            )}
        </Widget>
      )}
    </Box>
  )
}
