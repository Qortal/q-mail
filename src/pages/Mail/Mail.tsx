import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../state/store'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import Joyride, { ACTIONS, EVENTS, STATUS, Step } from 'react-joyride'
import SendIcon from '@mui/icons-material/Send'
import MailIcon from '@mui/icons-material/Mail'
import GroupIcon from '@mui/icons-material/Group'
import { styled } from '@mui/system'
import {
  Box,
  Button,
  Input,
  Typography,
  useTheme,
  IconButton,
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material'
import { useFetchPosts } from '../../hooks/useFetchPosts'
import LazyLoad from '../../components/common/LazyLoad'
import { removePrefix } from '../../utils/blogIdformats'
import { NewMessage } from './NewMessage'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useFetchMail } from '../../hooks/useFetchMail'
import { ShowMessage } from './ShowMessage'
import { fetchAndEvaluateMail } from '../../utils/fetchMail'
import { addToHashMapMail } from '../../state/features/mailSlice'
import { setIsLoadingGlobal } from '../../state/features/globalSlice'
import SimpleTable from './MailTable'
import { AliasMail } from './AliasMail'
import { SentMail } from './SentMail'
import { NewThread } from './NewThread'
import { GroupMail } from './GroupMail'

const steps: Step[] = [
  {
    content: (
      <div>
        <h2>Welcome To Q-Mail</h2>
        <p
          style={{
            fontSize: '18px'
          }}
        >
          Let's take a tour
        </p>
        <p
          style={{
            fontSize: '12px'
          }}
        >
          The Qortal community, along with its development team and the creators
          of this application, cannot be held accountable for any content
          published or displayed. Furthermore, they bear no responsibility for
          any data loss that may occur as a result of using this application.
        </p>
      </div>
    ),
    placement: 'center',
    target: '.step-1'
  },

  {
    target: '.step-2',
    content: (
      <div>
        <h2>Composing a mail message</h2>
        <p
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          }}
        >
          Compose a secure message featuring encrypted attachments (up to 25MB
          per attachment).
        </p>
        <p
          style={{
            fontSize: '18px',
            fontFamily: 'Arial'
          }}
        >
          To protect the identity of the recipient, assign them an alias for
          added anonymity.
        </p>
      </div>
    ),
    placement: 'bottom'
  },
  {
    target: '.step-3',
    content: (
      <div>
        <h2>What is an alias?</h2>
        <p
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'Arial'
          }}
        >
          To conceal the identity of the message recipient, utilize the alias
          option when sending.
        </p>
        <p
          style={{
            fontSize: '14px',
            fontFamily: 'Arial'
          }}
        >
          For instance, instruct your friend to address the message to you using
          the alias 'FrederickGreat'.
        </p>
        <p
          style={{
            fontSize: '14px',
            fontFamily: 'Arial'
          }}
        >
          To access messages sent to that alias, simply enter 'FrederickGreat'
          in the provided input field and click the '+ Alias' button.
        </p>
      </div>
    ),
    placement: 'bottom'
  }
]

const GroupTabs = styled(Tabs)({
  maxWidth: '50vw'
})

interface MailProps {
  isFromTo: boolean
}

export const Mail = ({ isFromTo }: MailProps) => {
  const theme = useTheme()
  const { user } = useSelector((state: RootState) => state.auth)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [message, setMessage] = useState<any>(null)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [valueTab, setValueTab] = React.useState<null | number>(0)
  const [valueTabGroups, setValueTabGroups] = React.useState<null | number>(
    null
  )
  const [paramTo, setParamTo] = useState<null | string>(null)
  const [aliasValue, setAliasValue] = useState('')
  const [alias, setAlias] = useState<string[]>([])
  const [run, setRun] = useState(false)
  const privateGroups = useSelector(
    (state: RootState) => state.global.privateGroups
  )
  const hasFetchedPrivateGroups = useSelector(
    (state: RootState) => state.global.hasFetchedPrivateGroups
  )
  const options = useMemo(() => {
    return Object.keys(privateGroups).map((key) => {
      return {
        ...privateGroups[key],
        name: privateGroups[key].groupName,
        id: key
      }
    })
  }, [privateGroups])
  const hashMapMailMessages = useSelector(
    (state: RootState) => state.mail.hashMapMailMessages
  )
  const mailMessages = useSelector(
    (state: RootState) => state.mail.mailMessages
  )

  const userName = useMemo(() => {
    if (!user?.name) return ''
    return user.name
  }, [user])

  const fullMailMessages = useMemo(() => {
    return mailMessages.map((msg) => {
      let message = msg
      const existingMessage = hashMapMailMessages[msg.id]
      if (existingMessage) {
        message = existingMessage
      }
      return message
    })
  }, [mailMessages, hashMapMailMessages])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { getMailMessages, checkNewMessages } = useFetchMail()
  const getMessages = React.useCallback(async () => {
    if (!user?.name || !user?.address) return
    await getMailMessages(user.name, user.address)
  }, [getMailMessages, user])

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
    content: any
  ) => {
    try {
      const existingMessage = hashMapMailMessages[messageIdentifier]
      if (existingMessage) {
        setMessage(existingMessage)
        setIsOpen(true)
        return
      }
      dispatch(setIsLoadingGlobal(true))
      const res = await fetchAndEvaluateMail({
        user,
        messageIdentifier,
        content,
        otherUser: user
      })
      setMessage(res)
      dispatch(addToHashMapMail(res))
      setIsOpen(true)
    } catch (error) {
    } finally {
      dispatch(setIsLoadingGlobal(false))
    }
  }

  const firstMount = useRef(false)
  useEffect(() => {
    if (user?.name && !firstMount.current) {
      getMessages()
      firstMount.current = true
    }
  }, [user])

  function a11yProps(index: number) {
    return {
      id: `mail-tabs-${index}`,
      'aria-controls': `mail-tabs-${index}`
    }
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValueTab(newValue)
    setValueTabGroups(null)
  }

  const handleChangeGroups = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setValueTabGroups(newValue)
    setValueTab(null)
  }

  function CustomTabLabelDefault({ label }: any) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            textTransform: 'none'
          }}
        >
          {label}
        </span>
        <IconButton id="close-button" edge="end" color="inherit" size="small">
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </div>
    )
  }

  function CustomTabLabel({ index, label }: any) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            textTransform: 'none'
          }}
        >
          {label}
        </span>
        <IconButton
          id="close-button"
          edge="end"
          color="inherit"
          size="small"
          onClick={(event) => {
            event.stopPropagation() // Add this l
            setValueTab(0)
            const newList = [...alias]

            newList.splice(index, 1)

            setAlias(newList)
            if (userName) {
              try {
                localStorage.setItem(
                  `alias-qmail-${userName}`,
                  JSON.stringify(newList)
                )
              } catch (error) {}
            }
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </div>
    )
  }

  function CustomTabLabelGroup({ index, label }: any) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <GroupIcon />
        <span
          style={{
            textTransform: 'none'
          }}
        >
          {label}
        </span>
      </div>
    )
  }

  useEffect(() => {
    const savedTourStatus = localStorage.getItem('tourStatus-qmail')
    if (!savedTourStatus || savedTourStatus === STATUS.SKIPPED) {
      setRun(true)
    }
  }, [])

  useEffect(() => {
    if (!userName) return
    const savedAlias = localStorage.getItem(`alias-qmail-${userName}`)
    if (savedAlias) {
      try {
        setAlias(JSON.parse(savedAlias))
      } catch (error) {
        console.error('Error parsing JSON from localStorage:', error)
      }
    }
  }, [userName])

  const handleJoyrideCallback = (data: any) => {
    const { action, status } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)
      localStorage.setItem('tourStatus-qmail', status)
    }
  }

  const handleOptionChange = (event: SelectChangeEvent<string>) => {
    const optionId = event.target.value
    const selectedOption = options.find((option: any) => option.id === optionId)
  }

  return (
    <Box
      className="step-1"
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        backgroundColor: 'background.paper'
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}
      >
        <Tabs
          value={valueTab}
          onChange={handleChange}
          aria-label="basic tabs example"
          variant="scrollable"
          sx={{
            maxWidth: '35vw'
          }}
        >
          <Tab
            sx={{
              '&.Mui-selected': {
                color: theme.palette.text.primary,
                fontWeight: theme.typography.fontWeightMedium
              }
            }}
            label={<CustomTabLabelDefault label={user?.name} />}
            {...a11yProps(0)}
          />
          {alias.map((alia, index) => {
            return (
              <Tab
                sx={{
                  '&.Mui-selected': {
                    color: theme.palette.text.primary,
                    fontWeight: theme.typography.fontWeightMedium
                  }
                }}
                key={alia}
                label={<CustomTabLabel index={index} label={alia} />}
                {...a11yProps(1 + index)}
              />
            )
          })}
        </Tabs>
        <Box
          className="step-3"
          sx={{
            display: 'flex'
          }}
        >
          <Input
            id="standard-adornment-alias"
            onChange={(e) => {
              setAliasValue(e.target.value)
            }}
            value={aliasValue}
            placeholder="Type in alias"
            sx={{
              marginLeft: '20px',
              '&&:before': {
                borderBottom: 'none'
              },
              '&&:after': {
                borderBottom: 'none'
              },
              '&&:hover:before': {
                borderBottom: 'none'
              },
              '&&.Mui-focused:before': {
                borderBottom: 'none'
              },
              '&&.Mui-focused': {
                outline: 'none'
              },
              fontSize: '14px',
              display: 'flex',
              minWidth: '120px'
            }}
          />
          <Button
            sx={{
              height: '30px',
              alignSelf: 'center',
              marginRight: '10px',
              flexShrink: 0
            }}
            onClick={() => {
              if (!aliasValue) return
              const newList = [...alias, aliasValue]
              if (userName) {
                try {
                  localStorage.setItem(
                    `alias-qmail-${userName}`,
                    JSON.stringify(newList)
                  )
                } catch (error) {}
              }

              setAlias((prev) => [...prev, aliasValue])
              setAliasValue('')
            }}
            variant="contained"
          >
            + alias
          </Button>
          {/* <Select
            labelId="Private Groups"
            input={<OutlinedInput label="Select group" />}
            onChange={handleOptionChange}
            MenuProps={{
              sx: {
                maxHeight: '300px' // Adjust this value to set the max height,
              }
            }}
          >
            {options.map((option: any) => (
              <MenuItem
                sx={{ color: theme.palette.text.primary }}
                key={option.id}
                value={option.id}
              >
                {option.name}
              </MenuItem>
            ))}
          </Select> */}
          {!hasFetchedPrivateGroups && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px'
                }}
              >
                Fetching groups...
              </Typography>
            </Box>
          )}
          <GroupTabs
            value={valueTabGroups}
            onChange={handleChangeGroups}
            aria-label="basic tabs example"
            variant="scrollable"
          >
            {options.map((group, index) => {
              return (
                <Tab
                  sx={{
                    '&.Mui-selected': {
                      color: theme.palette.text.primary,
                      fontWeight: theme.typography.fontWeightMedium
                    }
                  }}
                  key={group.id}
                  label={
                    <CustomTabLabelGroup index={index} label={group.name} />
                  }
                  {...a11yProps(1 + index)}
                />
              )
            })}
          </GroupTabs>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}
      >
        {valueTab === 0 || valueTab === 500 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: theme.palette.background.default,
              height: 'auto',
              padding: '5px',
              cursor: 'pointer',
              margin: '7px 10px 7px 7px;'
            }}
            onClick={() => {
              if (valueTab === 0) {
                setValueTab(500)
                return
              }
              setValueTab(0)
            }}
          >
            {valueTab === 0 && (
              <>
                <SendIcon
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
                  Sent
                </Typography>
              </>
            )}
            {valueTab === 500 && (
              <>
                <MailIcon
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
                  Inbox
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <div />
        )}
        {!valueTabGroups && valueTabGroups !== 0 && (
          <NewMessage
            isFromTo={isFromTo}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            alias={
              valueTab === 0 || valueTab === null ? '' : alias[valueTab - 1]
            }
          />
        )}
      </Box>
      <ShowMessage
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        message={message}
        setReplyTo={setReplyTo}
      />

      <TabPanel value={valueTab} index={0}>
        <SimpleTable
          openMessage={openMessage}
          data={fullMailMessages}
        ></SimpleTable>
        <LazyLoad onLoadMore={getMessages}></LazyLoad>
      </TabPanel>

      <TabPanel value={valueTab} index={500}>
        <SentMail />
      </TabPanel>

      {alias.map((alia, index) => {
        return (
          <TabPanel key={alia} value={valueTab} index={1 + index}>
            <AliasMail value={alia} />
          </TabPanel>
        )
      })}
      {options.map((group, index) => {
        return (
          <TabPanel key={group.id} value={valueTabGroups} index={index}>
            <GroupMail groupInfo={group} />
          </TabPanel>
        )
      })}

      <Joyride
        steps={steps}
        run={run}
        callback={handleJoyrideCallback}
        continuous={true}
        scrollToFirstStep={true}
        showProgress={true}
        showSkipButton={true}
      />
    </Box>
  )
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number | null
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mail-tabs-${index}`}
      aria-labelledby={`mail-tabs-${index}`}
      {...other}
      style={{
        width: '100%'
      }}
    >
      {value === index && children}
    </div>
  )
}
