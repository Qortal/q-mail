import React from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material'

export interface ModalProps {
  open: boolean
  title: string
  message: string
  handleConfirm: () => void
  handleCancel: () => void
}

const ConfirmationModal: React.FC<ModalProps> = ({
  open,
  title,
  message,
  handleConfirm,
  handleCancel
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleCancel} color="primary">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          color="primary"
          autoFocus
        >
          Proceed
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmationModal
