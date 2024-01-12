import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { addUser } from "../state/features/authSlice";
import { RootState } from "../state/store";

import NavBar from "../components/layout/Navbar/Navbar";
import PageLoader from "../components/common/PageLoader";

import localForage from "localforage";
import ConsentModal from "../components/modals/ConsentModal";
import { AudioPlayer } from "../components/common/AudioPlayer";
import { setPrivateGroups } from "../state/features/globalSlice";
import { LoaderBar } from "../components/common/LoaderBar";
import { addAllHashMapSubject } from "../state/features/mailSlice";
interface Props {
  children: React.ReactNode;
}
interface DataEntry {
  timestamp: number;
  [key: string]: any; // Allows for additional fields of various types
}

interface DataObject {
  [identifier: string]: DataEntry;
}

const GlobalWrapper: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch();

  const [userAvatar, setUserAvatar] = useState<string>("");

  const { user } = useSelector((state: RootState) => state.auth);
  const { audios, currAudio } = useSelector((state: RootState) => state.global);
  const favoritesLocalRef = useRef<any>(null);
  const privateGroups = useSelector(
    (state: RootState) => state.global.privateGroups
  );
  useEffect(() => {
    if (!user?.name) return;
    const dynamicInstanceName = `q-blog-favorites-${user.name}`; // Replace this with your dynamic value
    favoritesLocalRef.current = localForage.createInstance({
      name: dynamicInstanceName,
    });
    getAvatar();
  }, [user?.name]);

  const getAvatar = async () => {
    try {
      let url = await qortalRequest({
        action: "GET_QDN_RESOURCE_URL",
        name: user?.name,
        service: "THUMBNAIL",
        identifier: "qortal_avatar",
      });

      if (url === "Resource does not exist") return;

      setUserAvatar(url);
    } catch (error) {
      console.error(error);
    }
  };

  const isLoadingGlobal = useSelector(
    (state: RootState) => state.global.isLoadingGlobal
  );
  const isLoadingCustom = useSelector(
    (state: RootState) => state.global.isLoadingCustom
  );
  async function getNameInfo(address: string) {
    const response = await fetch("/names/address/" + address);
    const nameData = await response.json();

    if (nameData?.length > 0) {
      return nameData[0].name;
    } else {
      return "";
    }
  }

  const privateGroupsRef = React.useRef<any>({});

  React.useEffect(() => {
    privateGroupsRef.current = privateGroups;
  }, [privateGroupsRef, privateGroups]);

  async function getGroups(address: string) {
    try {
      const groups: any = {};
      const response = await fetch("/groups/member/" + address);
      const groupData = await response.json();
      const filterPrivate = groupData?.filter(
        (group: any) => group?.isOpen === false
      );
      if (filterPrivate?.length > 0) {
        for (const group of filterPrivate) {
          const groupNumber = group.groupId;
          groups[groupNumber] = {
            ...group,

          };
        }
      }
      dispatch(setPrivateGroups(groups));
    } catch (error) {
      console.log({ error });
    }
  }
  // async function getGroups(address: string) {
  //   try {
  //     const groups: any = {};
  //     const response = await fetch("/groups/member/" + address);
  //     const groupData = await response.json();
  //     const filterPrivate = groupData?.filter(
  //       (group: any) => group?.isOpen === false
  //     );
  //     if (filterPrivate?.length > 0) {
  //       for (const group of filterPrivate) {
  //         const groupNumber = group.groupId;
  //         let prevGroupMembers = privateGroupsRef.current?.[groupNumber] || {};
  //         if (prevGroupMembers) {
  //           prevGroupMembers = {
  //             ...(prevGroupMembers?.membersByAddress || {}),
  //           };
  //         }
  //         const response = await fetch(
  //           `/groups/members/${groupNumber}?limit=0`
  //         );
  //         const groupData = await response.json();

  //         let members: any = {};
  //         let membersByAddress: any = {};
  //         if (groupData && Array.isArray(groupData?.members)) {
  //           for (const member of groupData.members) {
  //             if (member.member) {
  //               if (prevGroupMembers[member.member]) {
  //                 delete prevGroupMembers[member.member];
  //                 continue;
  //               }
  //               const res = await getNameInfo(member.member);
  //               const resAddress = await qortalRequest({
  //                 action: "GET_ACCOUNT_DATA",
  //                 address: member.member,
  //               });
  //               const name = res;
  //               const publicKey = resAddress.publicKey;
  //               if (name) {
  //                 members[name] = {
  //                   publicKey,
  //                   address: member.member,
  //                 };
  //                 membersByAddress[member.member] = true;
  //               }
  //             }
  //           }
  //         }

  //         let oldGroup = privateGroupsRef.current?.[groupNumber];
  //         if (oldGroup) {
  //           oldGroup = structuredClone(privateGroupsRef.current[groupNumber]);
  //         }
  //         let remainingMembers: any = {};
  //         let remainingMembersByAddress: any = {};
  //         for (const memberName of Object.keys(oldGroup?.members || {})) {
  //           const member = oldGroup?.members[memberName];
  //           if (member && prevGroupMembers[member.address]) {
  //             continue;
  //           } else if (member) {
  //             remainingMembers[memberName] = member;
  //             remainingMembersByAddress[member.address] = true;
  //           }
  //         }
  //         const addNewMembers = {
  //           ...remainingMembers,
  //           ...members,
  //         };
  //         const addNewMembersByAddress = {
  //           ...membersByAddress,
  //           ...remainingMembersByAddress,
  //         };
  //         groups[groupNumber] = {
  //           ...group,
  //           members: addNewMembers,
  //           membersByAddress: addNewMembersByAddress,
  //         };
  //       }
  //     }
  //     dispatch(setPrivateGroups(groups));
  //   } catch (error) {
  //     console.log({ error });
  //   }
  // }
  const interval = useRef<any>(null);

  const getLocalSubjects = async (name?: string) => {
    try {
      const subjects = JSON.parse(
        localStorage.getItem(`qmail_persistance_${name}`) || "{}"
      );
      // Convert to an array of objects with identifier and all fields
      let dataArray = Object.entries(subjects).map(([identifier, value]) => ({
        identifier,
        ...(value as DataEntry),
      }));

      // Sort the array based on timestamp in descending order
      dataArray.sort((a, b) => b.timestamp - a.timestamp);

      // Slice the array to keep only the first 500 elements
      let latest500 = dataArray.slice(0, 500);

      // Convert back to the original object format
      let latest500Data: DataObject = {};
      latest500.forEach(item => {
        const { identifier, ...rest } = item;
        latest500Data[identifier] = rest;
      });
      localStorage.setItem(
        `qmail_persistance_${name}`,
        JSON.stringify(latest500Data)
      );
      dispatch(addAllHashMapSubject(latest500Data));
    } catch (error) {
      localStorage.setItem(`qmail_persistance_${name}`, JSON.stringify({}));
    }
  };

  const checkGroupMembers = React.useCallback(
    (address: string) => {
      let isCalling = false;
      interval.current = setInterval(async () => {
        if (isCalling) return;
        isCalling = true;
        const res = await getGroups(address);
        isCalling = false;
      }, 600000);
    },
    [getGroups, privateGroups]
  );

  const askForAccountInformation = React.useCallback(async () => {
    try {
      let account = await qortalRequest({
        action: "GET_USER_ACCOUNT",
      });

      const name = await getNameInfo(account.address);
      dispatch(addUser({ ...account, name }));
      getGroups(account.address);
      checkGroupMembers(account.address);
      if (name) {
        getLocalSubjects(name);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  React.useEffect(() => {
    askForAccountInformation();
  }, []);

  return (
    <>
      {isLoadingGlobal && <PageLoader />}
      {isLoadingCustom && <LoaderBar message={isLoadingCustom} />}
      <NavBar
        isAuthenticated={!!user}
        userName={user?.name || ""}
        userAvatar={userAvatar}
        authenticate={askForAccountInformation}
      />
      <ConsentModal />
      {children}

      {audios && audios.length > 0 && (
        <AudioPlayer currAudio={currAudio} playlist={audios} />
      )}
    </>
  );
};

export default GlobalWrapper;
