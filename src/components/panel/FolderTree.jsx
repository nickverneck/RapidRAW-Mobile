import { useState } from 'react';
import { Folder, FolderOpen, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

function TreeNode({ node, onFolderSelect, selectedPath, isExpanded, onToggle, onContextMenu, expandedFolders, isTreeHovered }) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.path === selectedPath;

  const handleFolderIconClick = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.path);
    }
  };

  const handleNameClick = () => {
    onFolderSelect(node.path);
  };

  const handleNameDoubleClick = () => {
    if (hasChildren) {
      onToggle(node.path);
    }
  };

  const containerVariants = {
    closed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
    open: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: 'easeInOut' } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: ({ index, total }) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        delay: total < 8 ? index * 0.05 : 0,
      },
    }),
    exit: { opacity: 0, x: -15, transition: { duration: 0.2 } },
  };

  return (
    <div className="text-sm">
      <div
        onContextMenu={(e) => onContextMenu(e, node.path)}
        className={clsx('flex items-center gap-2 p-1.5 rounded-md transition-colors', {
          'bg-card-active': isSelected,
          'hover:bg-surface': !isSelected,
        })}
        onClick={handleNameClick}
      >
        <div
          onClick={handleFolderIconClick}
          className={clsx('cursor-pointer p-0.5 rounded hover:bg-surface', {
            'cursor-default': !hasChildren,
          })}
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-hover-color flex-shrink-0" />
            ) : (
              <Folder size={16} className="text-text-secondary flex-shrink-0" />
            )
          ) : (
            <Folder size={16} className="text-text-secondary flex-shrink-0" />
          )}
        </div>
        <span 
          onDoubleClick={handleNameDoubleClick}
          className="truncate select-none cursor-pointer flex-1"
        >
          {node.name}
        </span>
        
        <div
          onClick={handleFolderIconClick}
          className={clsx(
            'p-0.5 rounded hover:bg-surface transition-opacity duration-200',
            {
              'cursor-pointer': hasChildren,
              'cursor-default': !hasChildren,
              'opacity-100': hasChildren && isTreeHovered,
              'opacity-0': hasChildren && !isTreeHovered,
            }
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronUp size={16} className="text-text-secondary flex-shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-text-secondary flex-shrink-0" />
            )
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            key="children-container"
            variants={containerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="pl-4 border-l border-border-color/20 ml-2 overflow-hidden"
          >
            <div className="py-1">
              <AnimatePresence>
                {node.children.map((childNode, index) => (
                  <motion.div
                    key={childNode.path}
                    layout="position"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={{ index, total: node.children.length }}
                  >
                    <TreeNode
                      node={childNode}
                      onFolderSelect={onFolderSelect}
                      selectedPath={selectedPath}
                      isExpanded={expandedFolders.has(childNode.path)}
                      onToggle={onToggle}
                      onContextMenu={onContextMenu}
                      expandedFolders={expandedFolders}
                      isTreeHovered={isTreeHovered}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FolderTree({ tree, onFolderSelect, selectedPath, isLoading, isVisible, setIsVisible, style, isResizing, onContextMenu, expandedFolders, onToggleFolder }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleEmptyAreaContextMenu = (e) => {
    if (e.target === e.currentTarget) {
      onContextMenu(e, null);
    }
  };
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        'relative bg-bg-secondary rounded-lg flex-shrink-0',
        !isResizing && 'transition-[width] duration-300 ease-in-out'
      )}
      style={style}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute top-1/2 -translate-y-1/2 right-1 w-6 h-10 hover:bg-card-active rounded-md flex items-center justify-center z-10"
        title={isVisible ? "Collapse Panel" : "Expand Panel"}
      >
        {isVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {isVisible && (
        <div 
          className="p-2 flex flex-col overflow-y-auto h-full"
          onContextMenu={handleEmptyAreaContextMenu}
        >
          {tree ? (
            <>
              <TreeNode 
                node={tree} 
                onFolderSelect={onFolderSelect} 
                selectedPath={selectedPath} 
                isExpanded={expandedFolders.has(tree.path)}
                onToggle={onToggleFolder}
                onContextMenu={onContextMenu}
                expandedFolders={expandedFolders}
                isTreeHovered={isHovered}
              />
              {tree.children.length === 0 && (
                <div className="text-xs text-text-secondary mt-2 px-2">
                  No subfolders found.
                </div>
              )}
            </>
          ) : isLoading ? (
            <p className="text-text-secondary text-sm animate-pulse p-2">Loading folder structure...</p>
          ) : (
            <p className="text-text-secondary text-sm p-2">Open a folder to see its structure.</p>
          )}
        </div>
      )}
    </div>
  );
}