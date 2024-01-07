import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import CloseIcon from "@mui/icons-material/Close";
import Joyride, { ACTIONS, EVENTS, STATUS, Step } from "react-joyride";
import SendIcon from "@mui/icons-material/Send";
import ComposeIconSVG from "../../assets/svgs/ComposeIcon.svg";
import ArrowDownSVG from "../../assets/svgs/ArrowDown.svg";
import MailSVG from "../../assets/svgs/mail.svg";
import SendSVG from "../../assets/svgs/Send.svg";

import CheckSVG from "../../assets/svgs/Check.svg";
import MailIcon from "@mui/icons-material/Mail";
import GroupIcon from "@mui/icons-material/Group";
import GroupSVG from "../../assets/svgs/Group.svg";
import AddAliasSVG from "../../assets/svgs/AddAlias.svg";
import HomeSVG from "../../assets/svgs/Home.svg";

import { styled } from "@mui/system";
import {
  Box,
  Button,
  Input,
  Typography,
  useTheme,
  IconButton,
  CircularProgress,
  Popover,
  TextField,
} from "@mui/material";
import LazyLoad from "../../components/common/LazyLoad";
import { NewMessage } from "./NewMessage";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useFetchMail } from "../../hooks/useFetchMail";
import { ShowMessage } from "./ShowMessage";

import SimpleTable from "./MailTable";
import { AliasMail } from "./AliasMail";
import { SentMail } from "./SentMail";
import { GroupMail } from "./GroupMail";
import { useModal } from "../../components/common/useModal";
import { OpenMail } from "./OpenMail";
import { MAIL_SERVICE_TYPE } from "../../constants/mail";
import {
  ArrowDownIcon,
  CloseParent,
  ComposeContainer,
  ComposeContainerBlank,
  ComposeIcon,
  ComposeP,
  InstanceContainer,
  InstanceFooter,
  InstanceLabel,
  InstanceListContainer,
  InstanceListContainerRow,
  InstanceListContainerRowCheck,
  InstanceListContainerRowCheckIcon,
  InstanceListContainerRowGroupIcon,
  InstanceListContainerRowLabelContainer,
  InstanceListContainerRowMain,
  InstanceListContainerRowMainP,
  InstanceListHeader,
  InstanceListParent,
  InstanceP,
  MailBody,
  MailBodyInner,
  MailBodyInnerHeader,
  MailBodyInnerScroll,
  MailContainer,
  MailIconImg,
  MessagesContainer,
  SelectInstanceContainer,
  SelectInstanceContainerInner,
  TypeInAliasTextfield,
} from "./Mail-styles";
import { MailMessageRow } from "./MailMessageRow";
import { CloseSVG } from "../../assets/svgs/CloseSVG";
import { objectToBase64 } from "../../utils/toBase64";

const steps: Step[] = [
  {
    content: (
      <div>
        <h2>Welcome To Q-Mail</h2>
        <p
          style={{
            fontSize: "18px",
          }}
        >
          Let's take a tour
        </p>
        <p
          style={{
            fontSize: "12px",
          }}
        >
          The Qortal community, along with its development team and the creators
          of this application, cannot be held accountable for any content
          published or displayed. Furthermore, they bear no responsibility for
          any data loss that may occur as a result of using this application.
        </p>
      </div>
    ),
    placement: "center",
    target: ".step-1",
  },

  {
    target: ".step-2",
    content: (
      <div>
        <h2>Composing a mail message</h2>
        <p
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            fontFamily: "Arial",
          }}
        >
          Compose a secure message featuring encrypted attachments (up to 25MB
          per attachment).
        </p>
        <p
          style={{
            fontSize: "18px",
            fontFamily: "Arial",
          }}
        >
          To protect the identity of the recipient, assign them an alias for
          added anonymity.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: ".step-3",
    content: (
      <div>
        <h2>What is an alias?</h2>
        <p
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            fontFamily: "Arial",
          }}
        >
          To conceal the identity of the message recipient, utilize the alias
          option when sending.
        </p>
        <p
          style={{
            fontSize: "14px",
            fontFamily: "Arial",
          }}
        >
          For instance, instruct your friend to address the message to you using
          the alias 'FrederickGreat'.
        </p>
        <p
          style={{
            fontSize: "14px",
            fontFamily: "Arial",
          }}
        >
          To access messages sent to that alias, simply enter 'FrederickGreat'
          in the provided input field and click the '+ Alias' button.
        </p>
      </div>
    ),
    placement: "bottom",
  },
];

const GroupTabs = styled(Tabs)({
  maxWidth: "50vw",
});

interface MailProps {
  isFromTo: boolean;
}

export const Mail = ({ isFromTo }: MailProps) => {
  const { isShow, onCancel, onOk, show } = useModal();
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpenInstanceList, setIsOpenInstanceList] = useState<boolean>(false);
  const anchorElInstance = useRef<any>(null);
  const [message, setMessage] = useState<any>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [valueTab, setValueTab] = React.useState<null | number>(0);
  const [valueTabGroups, setValueTabGroups] = React.useState<null | number>(
    null
  );
  const [paramTo, setParamTo] = useState<null | string>(null);
  const [aliasValue, setAliasValue] = useState("");
  const [alias, setAlias] = useState<string[]>([]);
  const [run, setRun] = useState(false);

  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const privateGroups = useSelector(
    (state: RootState) => state.global.privateGroups
  );
  const [mailInfo, setMailInfo] = useState<any>(null);
  const hasFetchedPrivateGroups = useSelector(
    (state: RootState) => state.global.hasFetchedPrivateGroups
  );
  const options = useMemo(() => {
    return Object.keys(privateGroups).map(key => {
      return {
        ...privateGroups[key],
        name: privateGroups[key].groupName,
        id: key,
      };
    });
  }, [privateGroups]);
  const hashMapMailMessages = useSelector(
    (state: RootState) => state.mail.hashMapMailMessages
  );
  const mailMessages = useSelector(
    (state: RootState) => state.mail.mailMessages
  );

  const userName = useMemo(() => {
    if (!user?.name) return "";
    return user.name;
  }, [user]);

  const fullMailMessages = useMemo(() => {
    return mailMessages.map(msg => {
      let message = msg;
      const existingMessage = hashMapMailMessages[msg.id];
      if (existingMessage) {
        message = existingMessage;
      }
      return message;
    });
  }, [mailMessages, hashMapMailMessages]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { getMailMessages, checkNewMessages } = useFetchMail();
  const getMessages = React.useCallback(
    async (isOnMount?: boolean) => {
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
    },
    [getMailMessages, user]
  );

  const interval = useRef<any>(null);

  const checkNewMessagesFunc = useCallback(() => {
    if (!user?.name || !user?.address) return;
    let isCalling = false;
    interval.current = setInterval(async () => {
      if (isCalling || !user?.name || !user?.address) return;
      isCalling = true;
      const res = await checkNewMessages(user?.name, user.address);
      isCalling = false;
    }, 30000);
  }, [checkNewMessages, user]);

  useEffect(() => {
    checkNewMessagesFunc();
    return () => {
      if (interval?.current) {
        clearInterval(interval.current);
      }
    };
  }, [checkNewMessagesFunc]);

  const openMessage = async (
    user: string,
    messageIdentifier: string,
    content: any
  ) => {
    try {
      const existingMessage: any = hashMapMailMessages[messageIdentifier];
      if (
        existingMessage &&
        existingMessage.isValid &&
        !existingMessage.unableToDecrypt
      ) {
        setMessage(existingMessage);
        setIsOpen(true);
        return;
      }
      setMailInfo({
        identifier: messageIdentifier,
        name: user,
        service: MAIL_SERVICE_TYPE,
      });
      const res: any = await show();
      setMailInfo(null);
      const existingMessageAgain = hashMapMailMessages[messageIdentifier];
      if (res && res.isValid && !res.unableToDecrypt) {
        setMessage(res);
        setIsOpen(true);
        return;
      }
    } catch (error) {
    } finally {
    }
  };

  const firstMount = useRef(false);
  useEffect(() => {
    if (user?.name && !firstMount.current) {
      getMessages(true);
      firstMount.current = true;
    }
  }, [user]);

  function a11yProps(index: number) {
    return {
      id: `mail-tabs-${index}`,
      "aria-controls": `mail-tabs-${index}`,
    };
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValueTab(newValue);
    setValueTabGroups(null);
  };

  const handleChangeGroups = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setValueTabGroups(newValue);
    setValueTab(null);
  };

  function CustomTabLabelDefault({ label }: any) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            textTransform: "none",
          }}
        >
          {label}
        </span>
        <IconButton id="close-button" edge="end" color="inherit" size="small">
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </div>
    );
  }

  function CustomTabLabel({ index, label }: any) {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            textTransform: "none",
          }}
        >
          {label}
        </span>
        <IconButton
          id="close-button"
          edge="end"
          color="inherit"
          size="small"
          onClick={event => {
            event.stopPropagation(); // Add this l
            setValueTab(0);
            const newList = [...alias];

            newList.splice(index, 1);

            setAlias(newList);
            if (userName) {
              try {
                localStorage.setItem(
                  `alias-qmail-${userName}`,
                  JSON.stringify(newList)
                );
              } catch (error) { }
            }
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </div>
    );
  }

  function CustomTabLabelGroup({ index, label }: any) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <GroupIcon />
        <span
          style={{
            textTransform: "none",
          }}
        >
          {label}
        </span>
      </div>
    );
  }

  useEffect(() => {
    const savedTourStatus = localStorage.getItem("tourStatus-qmail");
    if (!savedTourStatus || savedTourStatus === STATUS.SKIPPED) {
      setRun(true);
    }
  }, []);

  useEffect(() => {
    if (!userName) return;
    const savedAlias = localStorage.getItem(`alias-qmail-${userName}`);
    if (savedAlias) {
      try {
        setAlias(JSON.parse(savedAlias));
      } catch (error) {
        console.error("Error parsing JSON from localStorage:", error);
      }
    }
  }, [userName]);

  const handleJoyrideCallback = (data: any) => {
    const { action, status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem("tourStatus-qmail", status);
    }
  };

  const handleCloseInstanceList = () => {
    setIsOpenInstanceList(false);
  };



  const addAlias = () => {
    if (!aliasValue) return;
    const newList = [...alias, aliasValue];
    if (userName) {
      try {
        localStorage.setItem(
          `alias-qmail-${userName}`,
          JSON.stringify(newList)
        );
      } catch (error) { }
    }

    setAlias(prev => [...prev, aliasValue]);
    setAliasValue("");
  }

  const handleInputKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      addAlias()
    }
  }

  return (
    <MailContainer>
      <InstanceContainer>
        <NewMessage isFromTo={isFromTo}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          alias={
            selectedAlias || ""
          } />
        <SelectInstanceContainer>
          <InstanceLabel>Current Instance:</InstanceLabel>
          <SelectInstanceContainerInner
            onClick={() => {
              setIsOpenInstanceList(true);
            }}
            ref={anchorElInstance}
          >
            <InstanceP>{selectedAlias ? selectedAlias : selectedGroup ? selectedGroup?.name : user?.name}</InstanceP>
            <ArrowDownIcon src={ArrowDownSVG} />
          </SelectInstanceContainerInner>
        </SelectInstanceContainer>
        <Popover
          open={isOpenInstanceList}
          anchorEl={anchorElInstance.current}
          onClose={handleCloseInstanceList}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          style={{ marginTop: "28px" }} // Adjust this value as needed
        >
          <InstanceListParent>
            <InstanceListHeader>
              <InstanceListContainerRowLabelContainer>
                <InstanceListContainerRowCheck></InstanceListContainerRowCheck>
                <InstanceListContainerRowMain>
                  <InstanceListContainerRowMainP>
                    Instances:
                  </InstanceListContainerRowMainP>
                </InstanceListContainerRowMain>
              </InstanceListContainerRowLabelContainer>
            </InstanceListHeader>
            <InstanceListContainer>
              <InstanceListContainerRow
                onClick={() => {
                  setSelectedAlias(null);
                  setSelectedGroup(null)
                  handleCloseInstanceList();
                }}
                sx={{
                  backgroundColor: (!selectedAlias && !selectedGroup) ? 'rgba(74, 158, 244, 1)' : 'unset'
                }}
              >
                <InstanceListContainerRowCheck>

                  <InstanceListContainerRowCheckIcon src={HomeSVG} />

                </InstanceListContainerRowCheck>
                <InstanceListContainerRowMain>
                  <InstanceListContainerRowMainP>
                    {user?.name}
                  </InstanceListContainerRowMainP>
                </InstanceListContainerRowMain>
              </InstanceListContainerRow>
              {alias.map((alia, index) => {
                return (
                  <InstanceListContainerRow
                    sx={{
                      backgroundColor: selectedAlias === alia ? 'rgba(74, 158, 244, 1)' : 'unset'
                    }}
                    key={alia}
                    onClick={() => {
                      setSelectedAlias(alia);
                      setSelectedGroup(null)
                      handleCloseInstanceList();
                    }}
                  >
                    <InstanceListContainerRowCheck>
                      {selectedAlias === alia && (
                        <InstanceListContainerRowCheckIcon src={CheckSVG} />
                      )}
                    </InstanceListContainerRowCheck>
                    <InstanceListContainerRowMain>
                      <InstanceListContainerRowMainP>
                        {alia}
                      </InstanceListContainerRowMainP>
                      <Box onClick={(e) => {
                        e.stopPropagation();
                        const newList = [...alias];

                        newList.splice(index, 1);

                        setAlias(newList);
                        if (userName) {
                          try {
                            localStorage.setItem(
                              `alias-qmail-${userName}`,
                              JSON.stringify(newList)
                            );
                          } catch (error) { }
                        }
                      }}>
                        <CloseSVG height="" width="" color="white" opacity={selectedAlias ? 1 : 0.2} />
                      </Box >
                    </InstanceListContainerRowMain>
                  </InstanceListContainerRow>
                );
              })}

              {options?.map((group) => {

                return (
                  <InstanceListContainerRow
                    onClick={() => {
                      setSelectedAlias(null);
                      setSelectedGroup(group);
                      handleCloseInstanceList();

                    }}
                    sx={{
                      backgroundColor: selectedGroup?.id === group?.id ? 'rgba(74, 158, 244, 1)' : 'unset'
                    }}
                    key={group?.id}
                  >
                    <InstanceListContainerRowCheck>
                      {/* {!selectedAlias && (
                    <InstanceListContainerRowCheckIcon src={CheckSVG} />
                  )} */}
                    </InstanceListContainerRowCheck>
                    <InstanceListContainerRowMain>
                      <InstanceListContainerRowMainP>
                        {group?.name}
                      </InstanceListContainerRowMainP>
                      <CloseParent>
                        <InstanceListContainerRowGroupIcon src={GroupSVG} />
                        <Box sx={{
                          visibility: 'hidden'
                        }}>
                          <CloseSVG height="" width="" color="white" opacity={0.2} />
                        </Box >
                      </CloseParent>
                    </InstanceListContainerRowMain>
                  </InstanceListContainerRow>
                )
              })}

            </InstanceListContainer>
            <InstanceFooter>
              <InstanceListContainerRowLabelContainer>
                <InstanceListContainerRowCheck>
                  <InstanceListContainerRowCheckIcon onClick={addAlias} src={AddAliasSVG} sx={{
                    cursor: 'pointer'
                  }} />
                </InstanceListContainerRowCheck>
                <TypeInAliasTextfield onKeyDown={handleInputKeyDown} value={aliasValue} placeholder="Type in Alias" onChange={(e) => {
                  setAliasValue(e.target.value)
                }} />
              </InstanceListContainerRowLabelContainer>
            </InstanceFooter>
          </InstanceListParent>
          {/* <InstanceList /> */}
        </Popover>
        <ComposeContainerBlank></ComposeContainerBlank>
      </InstanceContainer>
      {selectedGroup ? (
        <GroupMail groupInfo={selectedGroup} />
      ) : (
        <MailBody>
          <MailBodyInner>
            <MailBodyInnerHeader>
              <MailIconImg src={MailSVG} />
              <ComposeP>Inbox</ComposeP>
            </MailBodyInnerHeader>
            <MailBodyInnerScroll sx={{
                  borderRight: '1px solid rgba(85, 84, 84, 0.4)'
            }}>
              <Box
                className="step-1"
                sx={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
               
                <ShowMessage
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  message={message}
                  setReplyTo={setReplyTo}
                />
                {!selectedAlias && (
                  <MessagesContainer>
                    {fullMailMessages.map(item => {
                      return (
                        <MailMessageRow
                          messageData={item}
                          openMessage={openMessage}
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
                )}

                {selectedAlias && <AliasMail value={selectedAlias} />}
                <Joyride
                  steps={steps}
                  run={run}
                  callback={handleJoyrideCallback}
                  continuous={true}
                  scrollToFirstStep={true}
                  showProgress={true}
                  showSkipButton={true}
                />
                {mailInfo && isShow && (
                  <OpenMail
                    open={isShow}
                    handleClose={onOk}
                    fileInfo={mailInfo}
                  />
                )}
              </Box>
            </MailBodyInnerScroll>
          </MailBodyInner>
          <MailBodyInner>
           
              <MailBodyInnerHeader>
                <MailIconImg src={SendSVG} />
                <ComposeP>Sent</ComposeP>
              </MailBodyInnerHeader>
              <MailBodyInnerScroll sx={{
                direction: 'rtl'
              }}>
              <Box
                className="step-1"
                sx={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  alignItems: "center",
                  direction: 'ltr'
                }}
              >
              <SentMail />
              </Box>
            </MailBodyInnerScroll>
          </MailBodyInner>
        </MailBody>
      )}


    </MailContainer>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number | null;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mail-tabs-${index}`}
      aria-labelledby={`mail-tabs-${index}`}
      {...other}
      style={{
        width: "100%",
      }}
    >
      {value === index && children}
    </div>
  );
}
