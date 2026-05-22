import React from "react";
import SearchBar from "@theme/SearchBar";
import OriginalPrimaryMenu from "@theme-original/Navbar/MobileSidebar/PrimaryMenu";

export default function PrimaryMenuWrapper(props): React.ReactElement {
  return (
    <>
      <div className="navbar-sidebar__search">
        <SearchBar />
      </div>
      <OriginalPrimaryMenu {...props} items={props.items} />
    </>
  );
}
