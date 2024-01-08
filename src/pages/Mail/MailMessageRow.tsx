import React, { useEffect, useMemo, useState } from "react";
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
import { base64ToUint8Array, uint8ArrayToObject } from "../../utils/toBase64";

interface MailMessageRowProp {
  messageData: any;
  openMessage: (user: string, id: string, content: any) => void;
  isOpen: boolean
}
export const MailMessageRow = ({
  messageData,
  openMessage,
  isOpen
}: MailMessageRowProp) => {
  const [subjectInHashDecrypted, setSubjectInHashDecrypted] = useState<null | string>(null)
  const [hasAttachment, setHasAttachment] = useState<null | boolean>(null)
    let isEncrypted = true;
    let hasAttachments = null
    let subject = ""
    const hashMapMailMessages = useSelector(
        (state: RootState) => state.mail.hashMapMailMessages
      );
      const hashMapSavedSubjects = useSelector(
        (state: RootState) => state.mail.hashMapSavedSubjects
      );
const subjectInHash = hashMapSavedSubjects[messageData?.id]
console.log({subjectInHash})
const data = hashMapMailMessages[messageData?.id]

if(subjectInHashDecrypted !== null){
  subject = subjectInHashDecrypted || "- no subject"
  hasAttachments = hasAttachment || false
}
if(data && data?.isValid && !data?.unableToDecrypt){
    isEncrypted = false
    subject = data?.subject || "- no subject"
    hasAttachments = (data?.attachments || [])?.length > 0
}


const getSubjectFromHash = async (subject: string, hasAttachmentParam: boolean) => {
  console.log({hasAttachmentParam})
  if(subject === undefined || subject === null) throw new Error('no subject')
  if(subject === ""){
    setSubjectInHashDecrypted("")
    setHasAttachment(hasAttachmentParam)
    return
  }
  let requestEncryptSubject: any = {
    action: 'DECRYPT_DATA',
    encryptedData: subject
  }
  const resDecryptSubject = await qortalRequest(requestEncryptSubject)
  const decryptToUnit8ArraySubject =
    base64ToUint8Array(resDecryptSubject)
  const responseDataSubject = uint8ArrayToObject(
    decryptToUnit8ArraySubject
  )
  console.log({responseDataSubject})
    if(responseDataSubject !== null || responseDataSubject !== undefined){
      setSubjectInHashDecrypted(responseDataSubject)
      setHasAttachment(hasAttachmentParam)
    }
}


console.log({subjectInHashDecrypted})
useEffect(()=> {
  if(!isEncrypted) return

  if(subjectInHashDecrypted !== null) return
  if(!subjectInHash || subjectInHash?.subject === undefined || subjectInHash?.subject === null ) return
  console.log({subjectInHash})
  getSubjectFromHash(subjectInHash?.subject, subjectInHash?.attachments)
}, [isEncrypted, subjectInHashDecrypted])
 
  return (
    <MailMessageRowContainer sx={{
      background: isOpen ? '#434448' : 'unset'
    }} onClick={()=> {
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
        {hasAttachments ?  <MailMessageRowInfoImg src={AttachmentSVG} /> : hasAttachments === false ? null : isEncrypted ?  <MailMessageRowInfoImg src={LockSVG} />   : null}
       

        {subject ? (
          <MailMessageRowInfoStatusRead>{subject}</MailMessageRowInfoStatusRead>
        )  : isEncrypted ? (
          <MailMessageRowInfoStatusNotDecrypted>ACCESS TO DECRYPT</MailMessageRowInfoStatusNotDecrypted>
        ) : null}
      </MailMessageRowInfo>
    </MailMessageRowContainer>
  );
};
