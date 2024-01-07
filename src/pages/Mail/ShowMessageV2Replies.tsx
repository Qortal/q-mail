import React, { useEffect, useMemo, useState } from "react";
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

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];
const uid = new ShortUniqueId();

export const ShowMessageV2Replies = ({
  message,
}: any) => {
  console.log({message})
  const username = useSelector((state: RootState) => state.auth?.user?.name);


  const [isExpanded, setIsExpanded] = useState(false);


  const isUser = useMemo(()=> {
    return username === message?.user
  }, [username, message])



  let cleanHTML = "";
  if (message?.htmlContent) {
    cleanHTML = DOMPurify.sanitize(message.htmlContent);
  }

  console.log({ message });
  return (
    <Box sx={{
      padding: !isUser ? '0px 15px' : 'unset',
      flexShrink: 0,
      width: '100%'
    }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        'border-radius': '4px',
'background': !isUser ? 'rgba(255, 255, 255, 0.80)' : 'unset',
padding: '7px',

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
        onClick={()=> {
          setIsExpanded((prev)=> !prev)
        }}
          sx={{
            cursor: 'pointer',
            display: "flex",
            gap: '20px',
            justifyContent: "flex-start",
            alignItems: "flex-start",
            width: "100%",
            flexDirection: !isUser ? 'row-reverse' : 'unset'
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
          sx={{
            color: !isUser ? 'black' : 'unset'
          }}
            >
              {message?.user}
            </ShowMessageNameP>
            <ShowMessageTimeP
            sx={{
              color: !isUser ? 'black' : 'unset'
            }}
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
            sx={{
              color: !isUser ? 'black' : 'unset'
            }}
            >
              {message?.subject}
            </ShowMessageSubjectP>
           
          </Box>
        </Box>
        {isExpanded && (
          <>
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
                          color: !isUser ? 'black' : 'unset'
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
          <DisplayHtml html={message?.textContentV2} textColor={!isUser ? "black": "white"}/>
        )}
          </>
        )}
      
      </Box>
    
    </Box>
    </Box>
  );
};
