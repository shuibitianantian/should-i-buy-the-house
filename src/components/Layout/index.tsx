import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  Tooltip,
  UnstyledButton,
  Stack,
  rem,
  Text,
  Title,
  Badge,
} from "@mantine/core";
import { IconAnalyze } from "@tabler/icons-react";
import classes from "./NavbarMinimalColored.module.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import RandomMovingBox from "../MovingBlock";
import CountdownModal from "../CountdownModal";

interface NavbarLinkProps {
  icon: typeof IconAnalyze;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={classes.link}
        data-active={active || undefined}
      >
        <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const navigations = [
  {
    icon: IconAnalyze,
    label: "House Analyzing",
    url: "/should-i-buy-the-one",
  },
];

export default ({}: PropsWithChildren<{}>) => {
  const [active, setActive] = useState(0);

  const navigate = useNavigate();

  const location = useLocation();

  const showWelcomeMessage = useMemo(() => {
    if (location.pathname === "/") {
      return true;
    }
    return false;
  }, [location.pathname]);

  const links = navigations.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => {
        setActive(index);
        navigate(link.url);
      }}
    />
  ));

  return (
    <div className="flex bg-gray-100 bg-opacity-25 w-full">
      <nav className={classes.navbar}>
        <div className={classes.navbarMain}>
          <Stack justify="center" gap={0}>
            {links}
          </Stack>
        </div>
      </nav>
      {showWelcomeMessage && <CountdownModal />}
      <div className="relative mt-4 overflow-auto ml-auto mr-auto">
        {showWelcomeMessage && <RandomMovingBox />}
        <Outlet />
      </div>
    </div>
  );
};
