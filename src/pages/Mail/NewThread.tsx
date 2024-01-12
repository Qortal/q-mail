import React, { Dispatch, useCallback, useEffect, useState } from "react";
import { ReusableModal } from "../../components/modals/ReusableModal";
import { Box, Button, Input, Typography, useTheme } from "@mui/material";
import { BuilderButton } from "../CreatePost/CreatePost-styles";
import BlogEditor from "../../components/editor/BlogEditor";
import EmailIcon from "@mui/icons-material/Email";
import { Descendant } from "slate";
import ShortUniqueId from "short-unique-id";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import { useDropzone } from "react-dropzone";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import CreateIcon from "@mui/icons-material/Create";
import { setNotification } from "../../state/features/notificationsSlice";
import { useNavigate, useLocation } from "react-router-dom";
import mime from "mime";
import ModalCloseSVG from "../../assets/svgs/ModalClose.svg";
import AttachmentSVG from "../../assets/svgs/NewMessageAttachment.svg";
import CreateThreadSVG from "../../assets/svgs/CreateThread.svg";


import {
  objectToBase64,
  objectToUint8Array,
  objectToUint8ArrayFromResponse,
  processFileInChunks,
  toBase64,
  uint8ArrayToBase64,
} from "../../utils/toBase64";
import {
  MAIL_ATTACHMENT_SERVICE_TYPE,
  MAIL_SERVICE_TYPE,
  THREAD_SERVICE_TYPE,
} from "../../constants/mail";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import useConfirmationModal from "../../hooks/useConfirmModal";
import { subscribeToEvent, unsubscribeFromEvent } from "../../utils/events";
import {
  AttachmentContainer,
  InstanceFooter,
  InstanceListContainer,
  InstanceListHeader,
  MoreImg,
  NewMessageAttachmentImg,
  NewMessageCloseImg,
  NewMessageHeaderP,
  NewMessageInputRow,
  NewMessageSendButton,
  NewMessageSendP,
} from "./Mail-styles";
import { Spacer } from "../../components/common/Spacer";
import { TextEditor } from "../../components/common/TextEditor/TextEditor";
import { SendNewMessage } from "../../assets/svgs/SendNewMessage";
import { formatBytes } from "../../utils/displaySize";
import { CreateThreadIcon } from "../../assets/svgs/CreateThreadIcon";
const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];
const uid = new ShortUniqueId();

interface NewMessageProps {
  hideButton?: boolean;
  groupInfo: any;
  currentThread?: any;
  isMessage?: boolean;
  messageCallback?: (val: any) => void;
  refreshLatestThreads?: () => void;
  members: any;
}
const maxSize = 25 * 1024 * 1024; // 25 MB in bytes
export const NewThread = ({
  groupInfo,
  members,
  hideButton,
  currentThread,
  isMessage = false,
  messageCallback,
  refreshLatestThreads,
}: NewMessageProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [value, setValue] = useState("");
  const [title, setTitle] = useState<string>("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [subject, setSubject] = useState<string>("");
  const [threadTitle, setThreadTitle] = useState<string>("");
  const [destinationName, setDestinationName] = useState("");
  const { user } = useSelector((state: RootState) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const theme = useTheme();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { getRootProps, getInputProps } = useDropzone({
    maxSize,
    onDrop: acceptedFiles => {
      let files: any[] = [];
      try {
        acceptedFiles.forEach(item => {
          const type = item?.type;
          if (!type) {
            files.push({
              file: item,
              mimetype: null,
              extension: null,
            });
          } else {
            const extension = mime.getExtension(type);
            if (!extension) {
              files.push({
                file: item,
                mimetype: type,
                extension: null,
              });
            } else {
              files.push({
                file: item,
                mimetype: type,
                extension: extension,
              });
            }
          }
        });
      } catch (error) {
        dispatch(
          setNotification({
            msg: "One of your files is corrupted",
            alertType: "error",
          })
        );
      }
      setAttachments(prev => [...prev, ...files]);
    },
    onDropRejected: rejectedFiles => {
      dispatch(
        setNotification({
          msg: "One of your files is over the 25mb limit",
          alertType: "error",
        })
      );
    },
  });

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);
  const openModalFromEvent = useCallback(() => {
    if (isMessage) return;
    setIsOpen(true);
  }, [isMessage]);
  const closeModal = () => {
    setAttachments([]);
    setSubject("");
    setDestinationName("");
    setValue("");
    setIsOpen(false);
  };

  console.log({ groupInfo });

  useEffect(() => {
    subscribeToEvent("openNewThreadModal", openModalFromEvent);

    return () => {
      unsubscribeFromEvent("openNewThreadModal", openModalFromEvent);
    };
  }, [openModalFromEvent]);

  const openModalPostFromEvent = useCallback(() => {
    console.log("openModalPostFromEvent");
    if (isMessage) {
      setIsOpen(true);
    }
  }, [isMessage]);

  useEffect(() => {
    subscribeToEvent("openNewThreadMessageModal", openModalPostFromEvent);

    return () => {
      unsubscribeFromEvent("openNewThreadMessageModal", openModalPostFromEvent);
    };
  }, [openModalPostFromEvent]);

  async function publishQDNResource() {
    let name: string = "";
    let errorMsg = "";

    name = user?.name || "";

    const missingFields: string[] = [];

    if (!isMessage && !threadTitle) {
      errorMsg = "Please provide a thread title";
    }

    if (!name) {
      errorMsg = "Cannot send a message without a access to your name";
    }
    if (!groupInfo) {
      errorMsg = "Cannot access group information";
    }

    // if (!description) missingFields.push('subject')
    if (missingFields.length > 0) {
      const missingFieldsString = missingFields.join(", ");
      const errMsg = `Missing: ${missingFieldsString}`;
      errorMsg = errMsg;
    }
    const noExtension = attachments.filter(item => !item.extension);
    if (noExtension.length > 0) {
      errorMsg =
        "One of your attachments does not have an extension (example: .png, .pdf, ect...)";
    }

    if (errorMsg) {
      dispatch(
        setNotification({
          msg: errorMsg,
          alertType: "error",
        })
      );
      throw new Error(errorMsg);
    }

    const mailObject: any = {
      subject,
      createdAt: Date.now(),
      version: 1,
      attachments,
      textContentV2: value,
      name,
      threadOwner: currentThread?.threadData?.name || name,
    };

    try {
      const groupPublicKeys = Object.keys(members)?.map(
        (key: any) => members[key]?.publicKey
      );
      console.log({ groupPublicKeys });
      if (!groupPublicKeys || groupPublicKeys?.length === 0) {
        throw new Error("No members in this group could be found");
      }

      // START OF ATTACHMENT LOGIC

      const attachmentArray: any[] = [];
      for (const singleAttachment of attachments) {
        const attachment = singleAttachment.file;

        const fileBase64 = await toBase64(attachment);
        if (typeof fileBase64 !== "string" || !fileBase64)
          throw new Error("Could not convert file to base64");
        const base64String = fileBase64.split(",")[1];

        const id = uid();
        const id2 = uid();
        const identifier = `attachments_qmail_${id}_${id2}`;
        let fileExtension = attachment?.name?.split(".")?.pop();
        if (!fileExtension) {
          fileExtension = singleAttachment.extension;
        }
        const obj = {
          name: name,
          service: MAIL_ATTACHMENT_SERVICE_TYPE,
          filename: `${id}.${fileExtension}`,
          originalFilename: attachment?.name || "",
          identifier,
          data64: base64String,
          type: attachment?.type,
        };

        attachmentArray.push(obj);
      }

      if (attachmentArray?.length > 0) {
        mailObject.attachments = attachmentArray.map(item => {
          return {
            identifier: item.identifier,
            name,
            service: MAIL_ATTACHMENT_SERVICE_TYPE,
            filename: item.filename,
            originalFilename: item.originalFilename,
            type: item?.type,
          };
        });

        const multiplePublish = {
          action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
          resources: [...attachmentArray],
          encrypt: true,
          publicKeys: groupPublicKeys,
        };
        await qortalRequest(multiplePublish);
      }

      //END OF ATTACHMENT LOGIC
      if (!isMessage) {
        const idThread = uid();
        const messageToBase64 = await objectToBase64(mailObject);
        const threadObject = {
          title: threadTitle,
          groupId: groupInfo.id,
          createdAt: Date.now(),
          name,
        };
        const threadToBase64 = await objectToBase64(threadObject);
        let identifierThread = `qortal_qmail_thread_group${groupInfo.id}_${idThread}`;
        let requestBodyThread: any = {
          name: name,
          service: THREAD_SERVICE_TYPE,
          data64: threadToBase64,
          identifier: identifierThread,
          description: threadTitle?.slice(0, 200),
          action: "PUBLISH_QDN_RESOURCE",
        };
        const idMsg = uid();
        let groupIndex = identifierThread.indexOf("group");
        let result = identifierThread.substring(groupIndex);
        let identifier = `qortal_qmail_thmsg_${result}_${idMsg}`;
        let requestBody: any = {
          name: name,
          service: MAIL_SERVICE_TYPE,
          data64: messageToBase64,
          identifier,
        };
        const multiplePublishMsg = {
          action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
          resources: [requestBody],
          encrypt: true,
          publicKeys: groupPublicKeys,
        };
        await qortalRequest(requestBodyThread);
        await qortalRequest(multiplePublishMsg);
        dispatch(
          setNotification({
            msg: "Message sent",
            alertType: "success",
          })
        );
        if (refreshLatestThreads) {
          refreshLatestThreads();
        }
        closeModal();
      } else {
        if (!currentThread) throw new Error("unable to locate thread Id");
        const idThread = currentThread.threadId;
        const messageToBase64 = await objectToBase64(mailObject);
        const idMsg = uid();
        let groupIndex = idThread.indexOf("group");
        let result = idThread.substring(groupIndex);
        let identifier = `qortal_qmail_thmsg_${result}_${idMsg}`;
        let requestBody: any = {
          name: name,
          service: MAIL_SERVICE_TYPE,
          data64: messageToBase64,
          identifier,
        };
        const multiplePublishMsg = {
          action: "PUBLISH_MULTIPLE_QDN_RESOURCES",
          resources: [requestBody],
          encrypt: true,
          publicKeys: groupPublicKeys,
        };
        await qortalRequest(multiplePublishMsg);
        dispatch(
          setNotification({
            msg: "Message sent",
            alertType: "success",
          })
        );
        if (messageCallback) {
          messageCallback({
            identifier,
            id: identifier,
            name,
            service: MAIL_SERVICE_TYPE,
            created: Date.now(),
            ...mailObject,
          });
        }

        closeModal();
      }
    } catch (error: any) {
      console.log({ error });
      let notificationObj = null;
      if (typeof error === "string") {
        notificationObj = {
          msg: error || "Failed to send message",
          alertType: "error",
        };
      } else if (typeof error?.error === "string") {
        notificationObj = {
          msg: error?.error || "Failed to send message",
          alertType: "error",
        };
      } else {
        notificationObj = {
          msg: error?.message || "Failed to send message",
          alertType: "error",
        };
      }
      if (!notificationObj) return;
      dispatch(setNotification(notificationObj));

      throw new Error("Failed to send message");
    }
  }

  const sendMail = () => {
    publishQDNResource();
  };
  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <ReusableModal
        open={isOpen}
        customStyles={{
          maxHeight: "95vh",
          maxWidth: "950px",
          height: "700px",
          borderRadius: "12px 12px 0px 0px",
          background: "var(--Mail-Backgrund, #313338)",
          padding: "0px",
          gap: "0px",
        }}
      >
        <InstanceListHeader
          sx={{
            backgroundColor: "unset",
            height: "69px",
            padding: "20px 42px",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <NewMessageHeaderP>
            {isMessage ? "Post Message" : "New Thread"}
          </NewMessageHeaderP>
          <NewMessageCloseImg onClick={closeModal} src={ModalCloseSVG} />
        </InstanceListHeader>
        <InstanceListContainer
          sx={{
            backgroundColor: "rgba(217, 217, 217, 1)",
            padding: "20px 42px",
            height: "calc(100% - 150px)",
            flexShrink: 0,
          }}
        >
          {!isMessage && (
            <>
            <Spacer height="10px" />
          <NewMessageInputRow>
          <Input
              id="standard-adornment-name"
              value={threadTitle}
              onChange={(e) => {
                setThreadTitle(e.target.value)
              }}
              placeholder="Thread Title"
              disableUnderline
              autoComplete='off'
              autoCorrect='off'
              sx={{
                width: '100%',
                color: 'var(--new-message-text)',
                '& .MuiInput-input::placeholder': {
                  color: 'rgba(84, 84, 84, 0.70) !important',
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '120%', // 24px
                  letterSpacing: '0.15px',
                  opacity: 1
                },
                '&:focus': {
                  outline: 'none',
                },
                // Add any additional styles for the input here
              }}
            />
            </NewMessageInputRow>
            </>
          )}
          
            <Spacer height="10px" />
          <NewMessageInputRow sx={{
            gap: '10px'
          }}>
            
          
            <AttachmentContainer
              {...getRootProps()}
              sx={{
                width: "fit-content",
              }}
            >
              <input {...getInputProps()} />
              <NewMessageAttachmentImg src={AttachmentSVG} />
            </AttachmentContainer>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              {attachments.map(({ file, extension }, index) => {
                return (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "16px",
                        color: !extension ? "red" : "rgba(84, 84, 84, 1)",
                      }}
                    >
                      {file?.name} ({formatBytes(file?.size || 0)})
                    </Typography>
                    <CloseIcon
                      onClick={() =>
                        setAttachments(prev =>
                          prev.filter((item, itemIndex) => itemIndex !== index)
                        )
                      }
                      sx={{
                        height: "16px",
                        width: "auto",
                        cursor: "pointer",
                        color: "rgba(84, 84, 84, 1)",
                      }}
                    />
                    {!extension && (
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "red",
                        }}
                      >
                        This file has no extension
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Spacer height="10px" />
          </NewMessageInputRow>
          <Spacer height="30px" />
          <Box
            sx={{
              maxHeight: "40vh",
            }}
          >
            <TextEditor
              inlineContent={value}
              setInlineContent={(val: any) => {
                setValue(val);
              }}
            />
          </Box>
        </InstanceListContainer>
        <InstanceFooter
          sx={{
            backgroundColor: "rgba(217, 217, 217, 1)",
            padding: "20px 42px",
            alignItems: "center",
            height: "90px",
          }}
        >
          <NewMessageSendButton onClick={sendMail}>
            <NewMessageSendP>
              {isMessage ? "Post" : "Create Thread"}
            </NewMessageSendP>
            {isMessage ? (
               <SendNewMessage
               color="red"
               opacity={1}
               height="25px"
               width="25px"
             />
            ) : (
              <CreateThreadIcon  color="red"
              opacity={1} height="25px" width="25px"  />
            )}
           
          </NewMessageSendButton>
        </InstanceFooter>
        {/* <Box
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
        <BuilderButton onClick={sendMail}>{'Post message'}</BuilderButton>
        <BuilderButton onClick={closeModal}>Close</BuilderButton> */}
      </ReusableModal>
    </Box>
  );
};
