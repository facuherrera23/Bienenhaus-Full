// apps/landing/src/components/Navbar.tsx
import { useEffect, useState } from 'preact/hooks';
import styles from '../styles/modules/Navbar.module.css';

interface NavLink {
    label: string;
    href: string;
    icon?: string;
}

const navLinks: NavLink[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Venta', href: '/catalogo?operacion=venta' },
    { label: 'Alquiler', href: '/catalogo?operacion=alquiler' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Equipo', href: '#equipo' },
    { label: 'Contacto', href: '#contacto' },
];

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeLink, setActiveLink] = useState('/');
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isHidden, setIsHidden] = useState(false);

    // Efecto para detectar scroll y ocultar/mostrar navbar
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Detectar si está scrolleado (para el blur)
            setIsScrolled(currentScrollY > 50);

            // Ocultar/mostrar navbar en scroll down/up (solo en desktop)
            if (currentScrollY > 100) {
                if (currentScrollY > lastScrollY) {
                    setIsHidden(true);
                } else {
                    setIsHidden(false);
                }
            } else {
                setIsHidden(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Bloquear scroll cuando el menú móvil está abierto
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const handleLinkClick = (href: string) => {
        setActiveLink(href);
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header
            className={`
        ${styles.navbar} 
        ${isScrolled ? styles.isScrolled : ''} 
        ${isHidden ? styles.isHidden : ''}
      `}
            role="banner"
        >
            <div className={`${styles.navbarInner} container`}>
                {/* Logo */}
                <a href="/" className={styles.logo} aria-label="BIENENHAUS PROPIEDADES">
                    <div className={styles.logoIcon}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect
                                x="2"
                                y="2"
                                width="28"
                                height="28"
                                rx="4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M8 16L16 8L24 16"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M12 12V20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M20 12V20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M8 20H24"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <div className={styles.logoText}>
                        <span className={styles.logoMain}>BIENENHAUS</span>
                        <span className={styles.logoSub}>PROPIEDADES</span>
                    </div>
                </a>

                {/* Desktop Navigation */}
                <nav className={styles.navMenu} aria-label="Navegación principal">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={activeLink === link.href ? styles.isActive : ''}
                            onClick={() => handleLinkClick(link.href)}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* Actions */}
                <div className={styles.navActions}>
                    <a href="/publicar" className={`${styles.btnPublish} ${styles.desktopOnly}`}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M2 7H12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M7 2V12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        Publicar
                    </a>

                    <button
                        className={styles.iconBtn}
                        aria-label="WhatsApp"
                        onClick={() => window.open('https://wa.me/5493516379651', '_blank')}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M7 10.5L9 12.5L13.5 7.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <circle
                                cx="10"
                                cy="10"
                                r="8.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </button>

                    <button className={styles.iconBtn} aria-label="Favoritos">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M10 17C10 17 2.5 12 2.5 7C2.5 4.5 4.5 3 6.5 3C8.5 3 9.5 4 10 5C10.5 4 11.5 3 13.5 3C15.5 3 17.5 4.5 17.5 7C17.5 12 10 17 10 17Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </button>

                    <button
                        className={`${styles.iconBtn} ${styles.hamburgerBtn}`}
                        aria-label="Menú"
                        aria-expanded={isMobileMenuOpen}
                        onClick={toggleMobileMenu}
                    >
                        <span className={styles.hamburgerLines}>
                            <span />
                            <span />
                            <span />
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.isOpen : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
            />

            {/* Mobile Menu */}
            <nav
                className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.isOpen : ''}`}
                aria-label="Navegación móvil"
                role="navigation"
            >
                <div className={styles.mobileMenuHeader}>
                    <span className={styles.mobileMenuTitle}>Menú</span>
                    <button
                        className={styles.mobileMenuClose}
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Cerrar menú"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className={styles.mobileMenuLinks}>
                    {navLinks.map((link, index) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`${styles.mobileLink} ${activeLink === link.href ? styles.isActive : ''}`}
                            onClick={() => handleLinkClick(link.href)}
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className={styles.mobileMenuFooter}>
                    <a href="/publicar" className={`${styles.btnPublish} ${styles.mobilePublish}`}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M2 7H12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M7 2V12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        Publicar Propiedad
                    </a>
                    <div className={styles.mobileSocial}>
                        <a href="#" aria-label="Instagram">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect
                                    x="1"
                                    y="1"
                                    width="18"
                                    height="18"
                                    rx="4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <circle
                                    cx="15"
                                    cy="5"
                                    r="1.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </a>
                        <a href="#" aria-label="Facebook">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M14 3H12.5C11.1193 3 10 4.11929 10 5.5V7.5H8V10.5H10V15.5H13V10.5H15L15.5 7.5H13V5.5C13 5.22386 13.2239 5 13.5 5H15.5V3H14Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </a>
                        <a href="#" aria-label="YouTube">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect
                                    x="1"
                                    y="4"
                                    width="18"
                                    height="12"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M9 8L13 10L9 12V8Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            </nav>
        </header>
    );
}
