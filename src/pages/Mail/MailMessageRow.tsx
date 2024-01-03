import React from "react";
import {
  MailMessageRowContainer,
  MailMessageRowInfo,
  MailMessageRowInfoImg,
  MailMessageRowInfoStatusNotDecrypted,
  MailMessageRowInfoStatusRead,
  MailMessageRowProfile,
  MessageExtraDate,
  MessageExtraInfo,
  MessageExtraName,
} from "./Mail-styles";
import { AvatarWrapper } from "./MailTable";
import { formatTimestamp } from "../../utils/time";
import LockSVG from '../../assets/svgs/Lock.svg'
import AttachmentSVG from '../../assets/svgs/Attachment.svg'
import { useSelector } from "react-redux";
import { RootState } from "../../state/store";

interface MailMessageRowProp {
  messageData: any;
  openMessage: (user: string, id: string, content: any) => void;
}
export const MailMessageRow = ({
  messageData,
  openMessage,
}: MailMessageRowProp) => {
    let isEncrypted = true;
    let hasAttachments = false
    let subject = ""
    const hashMapMailMessages = useSelector(
        (state: RootState) => state.mail.hashMapMailMessages
      );

const data = hashMapMailMessages[messageData?.id]
if(data && data?.isValid && !data?.unableToDecrypt){
    isEncrypted = false
    subject = data?.subject || "- no subject"
    hasAttachments = (data?.attachments || [])?.length > 0
}
console.log({data})
 
  return (
    <MailMessageRowContainer onClick={()=> {
        openMessage(messageData?.user, messageData?.id, messageData)
    }}>
      <MailMessageRowProfile>
        <AvatarWrapper height="50px" user={messageData?.user}></AvatarWrapper>
        <MessageExtraInfo>
          <MessageExtraName sx={{
            fontWeight: isEncrypted  ? '900' : '300'
          }}>{messageData?.user}</MessageExtraName>
          <MessageExtraDate>{formatTimestamp(messageData?.createdAt)}</MessageExtraDate>
        </MessageExtraInfo>
      </MailMessageRowProfile>
      <MailMessageRowInfo>
        {isEncrypted ?  <MailMessageRowInfoImg src={LockSVG} /> : hasAttachments ?  <MailMessageRowInfoImg src={AttachmentSVG} /> : null}
       

        {isEncrypted ? (
          <MailMessageRowInfoStatusNotDecrypted>ACCESS TO DECRYPT</MailMessageRowInfoStatusNotDecrypted>
        ) : (
          <MailMessageRowInfoStatusRead>{subject}</MailMessageRowInfoStatusRead>
        )}
      </MailMessageRowInfo>
    </MailMessageRowContainer>
  );
};
