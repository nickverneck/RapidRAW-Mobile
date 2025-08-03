import { createContext, useState, useContext, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const ContextMenuContext = createContext();

export function useContextMenu() {
  return useContext(ContextMenuContext);
}

function SubMenu({ parentRef, options, hideContextMenu, closeSubmenu, cancelCloseSubmenu }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useLayoutEffect(() => {
    if (isClient && parentRef.current && menuRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const menuEl = menuRef.current;

      const subMenuWidth = menuEl.offsetWidth;
      const subMenuHeight = menuEl.offsetHeight;

      if (subMenuWidth === 0 || subMenuHeight === 0) return;

      let top = parentRect.top;
      let left = parentRect.right - 4;

      if (left + subMenuWidth > window.innerWidth) {
        left = parentRect.left - subMenuWidth + 4;
      }
      if (left < 0) {
        left = 5;
      }

      if (top + subMenuHeight > window.innerHeight) {
        top = window.innerHeight - subMenuHeight - 5;
      }
      if (top < 0) {
        top = 5;
      }

      setStyle({ top: `${top}px`, left: `${left}px`, opacity: 1 });
    }
  }, [isClient, parentRef, options]);

  const menuMarkup = (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className="fixed z-[51]"
      style={style}
      onMouseEnter={cancelCloseSubmenu}
      onMouseLeave={closeSubmenu}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-surface/90 backdrop-blur-md rounded-lg shadow-xl p-2 w-56" role="menu">
        {options.map((option, index) => (
          <MenuItem
            key={index}
            option={option}
            index={index}
            isSubmenuItem={true}
            hideContextMenu={hideContextMenu}
          />
        ))}
      </div>
    </motion.div>
  );

  if (!isClient) {
    return null;
  }

  return createPortal(menuMarkup, document.body);
}

function MenuItem({ option, index, isSubmenuItem = false, hideContextMenu }) {
  const { activeSubmenu, openSubmenu, closeSubmenu, cancelCloseSubmenu } = useContextMenu();
  const itemRef = useRef(null);

  const isSubmenuOpen = !isSubmenuItem && activeSubmenu === index;

  const handleMouseEnter = () => {
    cancelCloseSubmenu();
    if (option.disabled) {
      if (!isSubmenuItem) closeSubmenu();
      return;
    }
    if (option.submenu) {
      openSubmenu(index);
    } else if (!isSubmenuItem) {
      closeSubmenu();
    }
  };

  const handleMouseLeave = () => {
    if (option.submenu && !option.disabled) {
      closeSubmenu();
    }
  };

  if (option.type === 'separator') {
    return <div className="h-px bg-text-secondary/20 my-1 mx-2" />;
  }

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
      <button
        ref={itemRef}
        onClick={() => {
          if (!option.disabled && !option.submenu) {
            option.onClick();
            hideContextMenu();
          }
        }}
        disabled={option.disabled}
        className={`
          w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 justify-between
          transition-colors duration-150
          ${option.isDestructive ? 'text-red-400 hover:bg-red-500/20' : 'text-text-primary hover:bg-bg-primary'}
          ${option.disabled ? 'text-text-secondary bg-transparent cursor-not-allowed' : ''}
        `}
        role="menuitem"
      >
        <div className="flex items-center gap-3">
          {option.icon && <option.icon size={16} />}
          {option.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }}></div>}
          <span>{option.label}</span>
        </div>
        {option.submenu && <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {isSubmenuOpen && option.submenu && (
          <SubMenu
            parentRef={itemRef}
            options={option.submenu}
            hideContextMenu={hideContextMenu}
            closeSubmenu={closeSubmenu}
            cancelCloseSubmenu={cancelCloseSubmenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContextMenu() {
  const { menuState, hideContextMenu, menuRef, menuId } = useContextMenu();
  const { isVisible, x, y, options } = menuState;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={menuId}
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="fixed z-50"
          style={{ top: y, left: x }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="bg-surface/90 backdrop-blur-md rounded-lg shadow-xl p-2 w-64" role="menu">
            {options.map((option, index) => (
              <MenuItem
                key={index}
                option={option}
                index={index}
                hideContextMenu={hideContextMenu}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ContextMenuProvider({ children }) {
  const [menuState, setMenuState] = useState({ isVisible: false, x: 0, y: 0, options: [] });
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [menuId, setMenuId] = useState(0);
  const menuRef = useRef(null);
  const submenuTimeoutRef = useRef(null);

  const showContextMenu = useCallback((x, y, options) => {
    const menuWidth = 256;
    const menuHeight = options.reduce((acc, opt) => acc + (opt.type === 'separator' ? 9 : 40), 0) + 16;
    const adjustedX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
    const adjustedY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

    setMenuState({ isVisible: true, x: adjustedX, y: adjustedY, options });
    setMenuId(id => id + 1);
    setActiveSubmenu(null);
  }, []);

  const hideContextMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isVisible: false }));
    setActiveSubmenu(null);
  }, []);

  const openSubmenu = useCallback((index) => {
    clearTimeout(submenuTimeoutRef.current);
    setActiveSubmenu(index);
  }, []);

  const closeSubmenu = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 200);
  }, []);

  const cancelCloseSubmenu = useCallback(() => {
    clearTimeout(submenuTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuElements = document.querySelectorAll('[role="menu"]');
      let isClickInside = false;
      menuElements.forEach(menuEl => {
        if (menuEl.contains(event.target)) {
          isClickInside = true;
        }
      });

      if (!isClickInside) {
        hideContextMenu();
      }
    };
    
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            hideContextMenu();
        }
    };

    if (menuState.isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', hideContextMenu, true);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', hideContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuState.isVisible, hideContextMenu]);

  const value = {
    menuState,
    showContextMenu,
    hideContextMenu,
    menuRef,
    activeSubmenu,
    openSubmenu,
    closeSubmenu,
    cancelCloseSubmenu,
    menuId,
  };

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      <ContextMenu />
    </ContextMenuContext.Provider>
  );
}