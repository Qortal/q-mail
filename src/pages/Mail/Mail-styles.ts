import { AppBar, Button, Toolbar, Typography, Box, TextField } from '@mui/material'
import { styled } from '@mui/system'

export const InstanceContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'var(--color-instance)',
    height: '83px',
    flexShrink: 0,
    justifyContent: 'space-between'
  }))
  export const MailContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 'calc(100vh - 78px)',
    overflow: 'hidden'
  }))

  export const MailBody = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: 'calc(100% - 83px)'
    // overflow: 'auto !important'
  }))
  export const MailBodyInner = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
    height: '100%'
  
  }))
  export const MailBodyInnerHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    width: '100%',
    height: '25px',
    marginTop: '50px',
    marginBottom: '35px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '11px'
  }))


  export const MailBodyInnerScroll = styled(Box)`
  display: flex;
  flex-direction: column;
  overflow: auto !important;
  transition: background-color 0.3s;
  height: calc(100% - 110px);
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    background-color: transparent; /* Initially transparent */
    transition: background-color 0.3s; /* Transition for background color */
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent; /* Initially transparent */
    border-radius: 3px; /* Scrollbar thumb radius */
    transition: background-color 0.3s; /* Transition for thumb color */
  }

  &:hover {
    &::-webkit-scrollbar {
      background-color: #494747; /* Scrollbar background color on hover */
    }

    &::-webkit-scrollbar-thumb {
      background-color: #FFFFFF3D; /* Scrollbar thumb color on hover */
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: #FFFFFF3D; /* Color when hovering over the thumb */
    }
  }
`;

  export const ComposeContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    width: '150px',
    alignItems: 'center',
    gap: '7px',
    padding: '30px',
    cursor: 'pointer',
    transition: '0.2s background-color',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: 'rgba(67, 68, 72, 1)'
    }
  }))
  export const ComposeContainerBlank = styled(Box)(({ theme }) => ({
    display: 'flex',
    width: '150px',
    alignItems: 'center',
    gap: '7px',
    padding: '30px',
  }))
  export const ComposeP = styled(Typography)(({ theme }) => ({
   fontSize: '16px',
   fontWeight: 500
  }))

  export const ComposeIcon = styled('img')({
    width: 'auto',
    height: 'auto',
    userSelect: 'none',
    objectFit: 'contain',
    cursor: 'pointer'
  })
  export const ArrowDownIcon = styled('img')({
    width: 'auto',
    height: 'auto',
    userSelect: 'none',
    objectFit: 'contain',
    cursor: 'pointer'
  })
  export const MailIconImg = styled('img')({
    width: 'auto',
    height: 'auto',
    userSelect: 'none',
    objectFit: 'contain',
  })

  export const MailMessageRowInfoImg = styled('img')({
    width: 'auto',
    height: 'auto',
    userSelect: 'none',
    objectFit: 'contain',
  })

  export const SelectInstanceContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '17px',
  }))
  export const SelectInstanceContainerInner = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    cursor: 'pointer'
  }))


  export const InstanceLabel = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 500,
    color: '#FFFFFF33'
   }))

   export const InstanceP = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 500
   }))

   

   export const MailMessageRowContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    justifyContent: 'space-between',
    borderRadius: '56px 5px 10px 56px',
    paddingRight: '15px',
    transition: 'background 0.2s',
    gap: '10px',
    '&:hover': {
      background: '#434448'
    }
  }))
  export const MailMessageRowProfile = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    justifyContent: 'flex-start',
    gap: '10px',
    width: '50%',
    overflow: 'hidden'
  }))
  export const MailMessageRowInfo = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    justifyContent: 'flex-start',
    gap: '7px',
    width: '50%'
  }))
  export const MailMessageRowInfoStatusNotDecrypted = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 900,
    textTransform: 'uppercase',
    paddingTop: '2px'
  }))
  export const MailMessageRowInfoStatusRead = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 300,
  }))

  export const MessageExtraInfo = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden'
  }))
  export const MessageExtraName = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 900,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  }))
  export const MessageExtraDate = styled(Typography)(({ theme }) => ({
    fontSize: '15px',
    fontWeight: 500,
  }))

  export const MessagesContainer  = styled(Box)(({ theme }) => ({
    width: '460px',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }))

  export const InstanceListParent  = styled(Box)`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 246px;
    max-height: 325px;
    width: 425px;
    padding: 10px 0px 7px 0px;
    background-color: var(--color-instance-popover-bg);
    border: 1px solid rgba(0, 0, 0, 0.1);

  `
   export const InstanceListHeader  = styled(Box)`
   display: flex;
   flex-direction: column;
   width: 100%;
   background-color: var(--color-instance-popover-bg);


   `
     export const InstanceFooter  = styled(Box)`
     display: flex;
     flex-direction: column;
     width: 100%;
     flex-shrink:0;
  
     `
  export const InstanceListContainer  = styled(Box)`

    width: 100%;
    display: flex;
    flex-direction: column;
     flex-grow: 1;
    
    overflow: auto !important;
    transition: background-color 0.3s;
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
      background-color: transparent; /* Initially transparent */
      transition: background-color 0.3s; /* Transition for background color */
    }
  
    &::-webkit-scrollbar-thumb {
      background-color: transparent; /* Initially transparent */
      border-radius: 3px; /* Scrollbar thumb radius */
      transition: background-color 0.3s; /* Transition for thumb color */
    }
  
    &:hover {
      &::-webkit-scrollbar {
        background-color: #494747; /* Scrollbar background color on hover */
      }
  
      &::-webkit-scrollbar-thumb {
        background-color: #FFFFFF3D; /* Scrollbar thumb color on hover */
      }
  
      &::-webkit-scrollbar-thumb:hover {
        background-color: #FFFFFF3D; /* Color when hovering over the thumb */
      }
    }
 `
export const InstanceListContainerRowLabelContainer  = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  height: '50px',
}))
export const InstanceListContainerRow  = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  height: '50px',
  cursor: 'pointer',
  transition: '0.2s background',
  '&:hover': {
    background: "rgba(67, 68, 72, 1)"
  },
  flexShrink: 0
}))
export const InstanceListContainerRowCheck  = styled(Box)(({ theme }) => ({
  width: '47px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))
export const InstanceListContainerRowMain = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  alignItems: 'center',
  paddingRight: '30px',
  overflow: 'hidden'
}))
export const CloseParent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '20px'
}))
export const InstanceListContainerRowMainP = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '16px',
  textOverflow: 'ellipsis',
  overflow: 'hidden'
}))

export const InstanceListContainerRowCheckIcon = styled('img')({
  width: 'auto',
  height: 'auto',
  userSelect: 'none',
  objectFit: 'contain',
})
export const InstanceListContainerRowGroupIcon = styled('img')({
  width: 'auto',
  height: 'auto',
  userSelect: 'none',
  objectFit: 'contain',
})
export const TypeInAliasTextfield = styled(TextField)({
  width: '340px', // Adjust the width as needed
  borderRadius: '5px',
  backgroundColor: 'rgba(30, 30, 32, 1)',
  border: 'none',
  outline: 'none',
  input: {
    fontSize: 16,
    color: 'white',
    '&::placeholder': {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.2)'
    },
    border: 'none',
    outline: 'none',
    padding: '10px',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: 'none',
    }
  },
  '& .MuiInput-underline:before': {
    borderBottom: 'none',
  },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottom: 'none',
  },
  '& .MuiInput-underline:after': {
    borderBottom: 'none',
  },
})