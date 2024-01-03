import React, { useRef, useState } from 'react'
import { Box, Popover, useTheme } from '@mui/material'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../state/store'
import { UserNavbar } from '../../common/UserNavbar/UserNavbar'
import { removePrefix } from '../../../utils/blogIdformats'
import { useLocation } from 'react-router-dom'
import { BlockedNamesModal } from '../../common/BlockedNamesModal/BlockedNamesModal'
import Logo from '../../../assets/svgs/Logo.svg'
import {
  AvatarContainer,
  CustomAppBar,
  CustomToolbar,
  DropdownContainer,
  DropdownText,
  QblogLogoContainer,
  AuthenticateButton,
  NavbarName
} from './Navbar-styles'
import { AccountCircleSVG } from '../../../assets/svgs/AccountCircleSVG'
import QMailLogo from '../../../assets/img/qmaillogo.png'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import {
  addFilteredPosts,
  setFilterValue,
  setIsFiltering
} from '../../../state/features/blogSlice'
interface Props {
  isAuthenticated: boolean
  userName: string | null
  userAvatar: string
  authenticate: () => void
}

const NavBar: React.FC<Props> = ({
  isAuthenticated,
  userName,
  userAvatar,
  authenticate
}) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const theme = useTheme()
  const { visitingBlog } = useSelector((state: RootState) => state.global)
  const location = useLocation()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [isOpenModal, setIsOpenModal] = React.useState<boolean>(false)
  const searchValRef = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)
  const stripBlogId = removePrefix(visitingBlog?.blogId || '')
  if (visitingBlog?.navbarConfig && location?.pathname?.includes(stripBlogId)) {
    return (
      <UserNavbar
        title={visitingBlog?.title || ''}
        menuItems={visitingBlog?.navbarConfig?.navItems || []}
        name={visitingBlog?.name || ''}
        blogId={visitingBlog?.blogId || ''}
      />
    )
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget as unknown as HTMLButtonElement | null
    setAnchorEl(target)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }
  const onClose = () => {
    setIsOpenModal(false)
  }
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  return (
    <CustomAppBar position="sticky" elevation={2}>
      <CustomToolbar variant="dense">
        <QblogLogoContainer
          style={{
            height: '54px'
          }}
          src={Logo}
          alt="Q-Mail Logo"
          onClick={() => {
            navigate(`/`)
            dispatch(setIsFiltering(false))
            dispatch(setFilterValue(''))
            dispatch(addFilteredPosts([]))
            searchValRef.current = ''
            if (!inputRef.current) return
            inputRef.current.value = ''
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {/* Add isAuthenticated && before username and wrap StyledButton in this condition*/}
          {!isAuthenticated && (
            <AuthenticateButton onClick={authenticate}>
              <ExitToAppIcon />
              Authenticate
            </AuthenticateButton>
          )}

          {isAuthenticated && userName && (
            <AvatarContainer onClick={handleClick}>
              <NavbarName>{userName}</NavbarName>
              {!userAvatar ? (
                <AccountCircleSVG
                  color={theme.palette.text.primary}
                  width="35"
                  height="35"
                />
              ) : (
                <img
                  src={userAvatar}
                  alt="User Avatar"
                  width="35"
                  height="35"
                  style={{
                    borderRadius: '50%'
                  }}
                />
              )}
              <ExpandMoreIcon id="expand-icon" sx={{ color: '#ACB6BF' }} />
            </AvatarContainer>
          )}
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
          >
            <DropdownContainer
              onClick={() => {
                setIsOpenModal(true)
                handleClose()
              }}
            >
              <PersonOffIcon
                sx={{
                  color: '#e35050'
                }}
              />
              <DropdownText>Blocked Names</DropdownText>
            </DropdownContainer>
          </Popover>
          {isOpenModal && (
            <BlockedNamesModal open={isOpenModal} onClose={onClose} />
          )}
        </Box>
      </CustomToolbar>
    </CustomAppBar>
  )
}

export default NavBar
