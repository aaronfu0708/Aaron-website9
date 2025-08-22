'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useRef } from 'react';

export default function Header({ 
    showMenu = false, 
    isMenuOpen = false, 
    onToggleMenu = null,
    showAuthNav = false,
    enableNoteQLink = false 
}) {
    const clickTimeoutRef = useRef(null);
    
    const handleMenuClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        
        // 清除之前的超時
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }
        
        // 設置新的超時，防止重複點擊
        clickTimeoutRef.current = setTimeout(() => {
            if (onToggleMenu) {
                onToggleMenu();
            }
            clickTimeoutRef.current = null;
        }, 150); // 增加到150ms，提供更强的防抖
    }, [onToggleMenu]);
    
    return (
        <section id="header">
            <header className="site-header">
                <div className="container header-container">
                    {enableNoteQLink ? (
                    <Link href="/homegame" className="brand-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                        NoteQ
                    </Link>
                ) : (
                    <div className="brand-name">NoteQ</div>
                )}
                    
                    {showAuthNav && (
                        <nav className="auth-nav">
                            <Link href="/login?signup=1" className="btn-signup">Sign up</Link>
                            <Link href="/login" className="btn-login">Login</Link>
                        </nav>
                    )}
                    
                    {showMenu && (
                        <button 
                            className={`menu-button ${isMenuOpen ? 'active' : ''}`}
                            aria-label="Toggle menu" 
                            onClick={handleMenuClick}
                        >
                            <Image src="/img/Vector-18.png" alt="Menu Icon" width={24} height={24} />
                        </button>
                    )}
                </div>
            </header>
        </section>
    );
} 