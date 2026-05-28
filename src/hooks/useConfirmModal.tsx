import { useCallback, useRef, useState } from "react";
import ConfirmationModal from "../components/common/ConfirmationModal";

type ConfirmationModalContent = {
  open: boolean;
  title: string;
  message: string;
};

type UseConfirmationModalProps = {
  title: string;
  message: string;
};

const useConfirmationModal = (props: UseConfirmationModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resolvePromiseRef = useRef<((value: boolean) => void) | null>(null);
  const modalContentRef = useRef<ConfirmationModalContent>({
    open: false,
    title: props.title,
    message: props.message,
  });

  modalContentRef.current = {
    open: isModalOpen,
    title: props.title,
    message: props.message,
  };

  const handleUserAction = useCallback((userConfirmed: boolean) => {
    setIsModalOpen(false);
    resolvePromiseRef.current?.(userConfirmed);
    resolvePromiseRef.current = null;
  }, []);

  const showModal = useCallback(async () => {
    setIsModalOpen(true);
    return new Promise<boolean>(resolve => {
      resolvePromiseRef.current = resolve;
    });
  }, []);

  const Modal = useCallback(() => {
    const { open, title, message } = modalContentRef.current;
    return (
      <ConfirmationModal
        open={open}
        title={title}
        message={message}
        handleConfirm={() => handleUserAction(true)}
        handleCancel={() => handleUserAction(false)}
      />
    );
  }, [handleUserAction]);

  return { Modal, showModal };
};

export default useConfirmationModal;
