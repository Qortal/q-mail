import React, { useCallback, useEffect, useMemo, useState } from "react";
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

function parseQuery(query: string) {
  // Regular expression to match both possible formats
  const regex = /qortal_qmail_mail_([^_]+)(?:_([^_]+))?_mail_/;
  const match = query.match(regex);

  if (match) {
      const recipientName = match[1];
      const recipientAddress = match[2] || null; // Will be null if the address part is not present
      return { recipientName, recipientAddress };
  }

  return { recipientName: null, recipientAddress: null };
}
interface MailMessageRowProp {
  messageData: any;
  openMessage: (user: string, id: string, content: any, alias?: string) => void;
  isOpen?: boolean;
  isFromSent?: boolean
}
export const MailMessageRow = ({
  messageData,
  openMessage,
  isOpen,
  isFromSent
}: MailMessageRowProp) => {
  const username = useSelector((state: RootState) => state.auth?.user?.name)
  const [subjectInHashDecrypted, setSubjectInHashDecrypted] = useState<null | string>(null)
  const [hasAttachment, setHasAttachment] = useState<null | boolean>(null)
  const [sentToNameInfo, setSentToNameInfo] = useState({
    name: ""
  })
  const [alias, setAlias] = useState<null | string>(null)

  const identifier = useMemo(()=> {
    return messageData?.id
  }, [messageData])

  const getSentToName = useCallback(async (id: string)=> {
    console.log({id2: id})
    try {
      const { recipientName, recipientAddress } = parseQuery(id);
      if(!recipientAddress && recipientName){
        console.log({recipientAddress, recipientName})
        setAlias(recipientName)
        return
      }
      if(!recipientName || !recipientAddress) return
      const response = await qortalRequest({
        action: "SEARCH_NAMES",
        query: recipientName,
        prefix: true, 
        limit: 10,
        reverse: false
      })
      const findName = response?.find((item: any)=> item?.owner?.includes(recipientAddress))
      if(findName){
        setSentToNameInfo({
          name: findName.name
        })
      }
      console.log({findName})
    } catch (error) {
      
    }
  }, [])
  useEffect(()=> {
    if(isFromSent && identifier){
      getSentToName(identifier)
    }
  }, [isFromSent, identifier])
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
console.log({messageData})
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

const name = useMemo(()=> {
  if(isFromSent){
    return sentToNameInfo?.name || ""
  }
  return messageData?.user
}, [sentToNameInfo, isFromSent, messageData])
 
  return (
    <MailMessageRowContainer sx={{
      background: isOpen ? '#434448' : 'unset'
    }} onClick={()=> {
        openMessage(messageData?.user, messageData?.id, messageData, isFromSent ?  (alias || name) : username) 
    }}>
      <MailMessageRowProfile>
        <AvatarWrapper isAlias={!!alias} height="50px" user={name} fallback={alias || name}></AvatarWrapper>
        <MessageExtraInfo>
          <MessageExtraName sx={{
            fontWeight: isFromSent ? '300' : isEncrypted  ? '900' : '300'
          }}>{isFromSent ? "To: " : ""} {alias || name}</MessageExtraName>
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
