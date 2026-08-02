'use client';

import { ChevronDown, HelpCircle, Home, ScrollText } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ChatMenuItem } from './chat-menu-item';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { SidebarTitle } from './sidebar-trigger';

export const AppSidebar: React.FC = () => {
  const { isMobile, setOpenMobile } = useSidebar();

  const onNavClick = () => {
    // Close the sidebar on mobile
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="z-20">
      <SidebarContent>
        <SidebarTitle />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/" onClick={onNavClick}>
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/articles" onClick={onNavClick}>
                    <ScrollText />
                    <span>Articles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <ChatMenuItem />

              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <HelpCircle />
                      <span>Help</span>
                      <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="pr-0 mr-0">
                      <SidebarMenuSubItem className="relative">
                        <SidebarMenuSubButton asChild>
                          <Link href="/terms" onClick={onNavClick}>
                            Terms of Service
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem className="relative">
                        <SidebarMenuSubButton asChild>
                          <Link href="/cookie-policy" onClick={onNavClick}>
                            Cookie Policy
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem className="relative">
                        <SidebarMenuSubButton asChild>
                          <a href="#" onClick={onNavClick} className="termly-display-preferences">
                            Consent Preferences
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
