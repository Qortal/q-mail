import React from 'react'
import { Box, Modal, useTheme } from '@mui/material'

interface MyModalProps {
  open: boolean
  onClose?: () => void
  onSubmit?: (obj: any) => Promise<void>
  children: any
  customStyles?: any
}

export const ReusableModal: React.FC<MyModalProps> = ({
  open,
  onClose,
  onSubmit,
  children,
  customStyles = {}
}) => {
  const theme = useTheme()
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      componentsProps={{
        backdrop: {
          style: {
            backdropFilter: 'blur(3px)',
          },
        },
      }}
      disableAutoFocus
  disableEnforceFocus
  disableRestoreFocus
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '75%',
          bgcolor: theme.palette.primary.main,
          boxShadow: 24,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          ...customStyles
        }}
      >
        {children}
      </Box>
    </Modal>
  )
}
