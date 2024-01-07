import React, { useEffect, useState } from "react";
import { ReusableModal } from "../../components/modals/ReusableModal";
import { Box, Button, Input, Typography } from "@mui/material";
import { BuilderButton } from "../CreatePost/CreatePost-styles";
import BlogEditor from "../../components/editor/BlogEditor";
import EmailIcon from "@mui/icons-material/Email";
import { Descendant } from "slate";
import ShortUniqueId from "short-unique-id";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DOMPurify from "dompurify";
import { setNotification } from "../../state/features/notificationsSlice";
import {
  objectToBase64,
  objectToUint8Array,
  objectToUint8ArrayFromResponse,
  uint8ArrayToBase64,
} from "../../utils/toBase64";
import ReadOnlySlate from "../../components/editor/ReadOnlySlate";
import MailThread from "./MailThread";
import { AvatarWrapper } from "./MailTable";
import { formatEmailDate, formatTimestamp } from "../../utils/time";
import FileElement from "../../components/FileElement";
import MailThreadWithoutCalling from "./MailThreadWithoutCalling";
import { DisplayHtml } from "../../components/common/TextEditor/DisplayHtml";
import { Spacer } from "../../components/common/Spacer";
import { ShowMessageButton, ShowMessageButtonImg, ShowMessageButtonP, ShowMessageNameP, ShowMessageSubjectP, ShowMessageTimeP } from "./Mail-styles";
import ReplySVG from '../../assets/svgs/Reply.svg'
import ForwardSVG from '../../assets/svgs/Forward.svg'
import { ShowMessageV2Replies } from "./ShowMessageV2Replies";

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];
const uid = new ShortUniqueId();

export const ShowMessageV2 = ({
  isOpen,
  setIsOpen,
  message,
  setReplyTo,
  alias,
}: any) => {
  const [value, setValue] = useState(initialValue);
  const [title, setTitle] = useState<string>("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [description, setDescription] = useState<string>("");
  const [isOpenMailThread, setIsOpenMailThread] = useState<boolean>(false);

  const [destinationName, setDestinationName] = useState("");
  const username = useSelector((state: RootState) => state.auth?.user?.name);
  const dispatch = useDispatch();
  const openModal = () => {
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setIsOpenMailThread(false);
  };

  const handleReply = () => {
    setReplyTo(message);
  };

  let cleanHTML = "";
  if (message?.htmlContent) {
    cleanHTML = DOMPurify.sanitize(message.htmlContent);
  }

  console.log({ message });
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: 1,
          flexGrow: 1,
          overflow: "auto",
          width: "100%",
          padding: "0 15px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: '20px',
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: "6px"
            }}
          >
            <AvatarWrapper height="40px" user={message?.user} />
            <Box sx={{
            display: "flex",
            flexDirection: 'column',
            gap: '1px',
            justifyContent: "flex-start",
            maxWidth: '160px',
            minWidth: '120px'

          }}>
            <ShowMessageNameP
        
            >
              {message?.user}
            </ShowMessageNameP>
            <ShowMessageTimeP
  
            >
              {formatEmailDate(message?.createdAt)}
            </ShowMessageTimeP>
            
            </Box>
            
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <ShowMessageSubjectP

            >
              {message?.subject}
            </ShowMessageSubjectP>
           
          </Box>
        </Box>
        {message?.attachments?.length > 0 && (
          <Box
            sx={{
              width: "100%",
              marginTop: "10px",
            }}
          >
            {message?.attachments.map((file: any) => {
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                      width: "auto",
                    }}
                  >
                    <FileElement
                      fileInfo={{ ...file, mimeTypeSaved: file?.type }}
                      title={file?.filename}
                      mode="mail"
                      otherUser={message?.user}
                    >
                      <AttachFileIcon
                        sx={{
                          height: "16px",
                          width: "auto",
                        }}
                      ></AttachFileIcon>
                      <Typography
                        sx={{
                          fontSize: "16px",
                        }}
                      >
                        {file?.originalFilename || file?.filename}
                      </Typography>
                    </FileElement>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
        <Spacer height="7px" />
        {message?.textContentV2 && (
          <DisplayHtml html={message?.textContentV2} />
        )}
        {message?.htmlContent && (
          <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: '25px',
          justifyContent: "center",
        }}
      >
        <ShowMessageButton onClick={handleReply}>
          <ShowMessageButtonImg src={ReplySVG} />
          <ShowMessageButtonP>
        Reply
          </ShowMessageButtonP></ShowMessageButton>
        <ShowMessageButton onClick={closeModal}>
          <ShowMessageButtonP>
          Forward
          </ShowMessageButtonP>
          <ShowMessageButtonImg src={ForwardSVG} />

          </ShowMessageButton>
      </Box>
      {/* {message?.generalData?.threadV2 && (
        <MailThreadWithoutCalling thread={message?.generalData?.threadV2} />
      )} */}
      <Spacer height="20px"/>
      <Box sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
      {message?.generalData?.threadV2?.map((msg: any)=> {
        if(!msg?.data) return null
        return <ShowMessageV2Replies message={msg?.data} />
      })}
      </Box>
    </Box>
  );
};
