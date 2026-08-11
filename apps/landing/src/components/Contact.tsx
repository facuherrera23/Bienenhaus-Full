// apps/landing/src/components/Contact.tsx
import { useState } from 'preact/hooks';
import { useScrollAnimation, useRipple } from '@/lib/motion';
import styles from '../styles/modules/Contact.module.css';

interface FormData {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  intent: string;
  message: string;
  privacy: boolean;
}

const intentOptions = ['Comprar', 'Vender', 'Alquilar', 'Invertir', 'Tasar', 'Otro'];

export function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    intent: 'Comprar',
    message: '',
    privacy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Scroll reveal para el header
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
    once: true,
  });

  // Scroll reveal para el formulario
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
  });

  // Scroll reveal para la info de contacto
  const { ref: infoRef, isVisible: infoVisible } = useScrollAnimation({
    threshold: 0.1,
    once: true,
    delay: 200,
  });

  const { RippleEffect } = useRipple();

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpiar error del campo
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!formData.privacy) newErrors.privacy = 'Debes aceptar la política de privacidad';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simular envío (reemplazar con llamada real a Supabase)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Resetear después de 5 segundos
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        intent: 'Comprar',
        message: '',
        privacy: false,
      });
    }, 5000);
  };

  return (
    <section className={styles.contact} id="contact">
      <div className="container">
        {/* Header */}
        <div 
          className={`${styles.contactHeader} ${headerVisible ? styles.visible : ''}`}
          ref={headerRef}
        >
          <span className={styles.contactLabel}>Contacto</span>
          <h2 className={styles.contactTitle}>
            <span className={styles.highlight}>Hablemos</span> de tu próximo hogar
          </h2>
          <p className={styles.contactDesc}>
            Completá el formulario y te contactaremos a la brevedad para
            asesorarte personalmente.
          </p>
          <button className={styles.btnContactSecondary}>
            Llamar ahora
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 3L13 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Layout */}
        <div className={styles.contactLayout}>
          {/* Información de contacto */}
          <div 
            className={`${styles.contactInfo} ${infoVisible ? styles.visible : ''}`}
            ref={infoRef}
          >
            <h3 className={styles.contactInfoTitle}>Información de contacto</h3>

            <div className={styles.contactInfoItem}>
              <div className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4L9 9L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="1" y="2" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className={styles.content}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>bienenhaus.propiedades@gmail.com</span>
              </div>
            </div>

            <div className={styles.contactInfoItem}>
              <div className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 2L6 5L4.5 7L6.5 10L8.5 12L10.5 10.5L13 12L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className={styles.content}>
                <span className={styles.label}>Teléfono</span>
                <span className={styles.value}>+54 9 3516 37-9651</span>
              </div>
            </div>

            <div className={styles.contactInfoItem}>
              <div className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 10.5C10.6569 10.5 12 9.15685 12 7.5C12 5.84315 10.6569 4.5 9 4.5C7.34315 4.5 6 5.84315 6 7.5C6 9.15685 7.34315 10.5 9 10.5Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 17C13 13.5 16 10.5 16 7.5C16 3.63401 12.866 0.5 9 0.5C5.13401 0.5 2 3.63401 2 7.5C2 10.5 5 13.5 9 17Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className={styles.content}>
                <span className={styles.label}>Ubicación</span>
                <span className={styles.value}>Córdoba, Argentina</span>
              </div>
            </div>

            {/* Horarios de atención */}
            <div className={styles.contactResponse}>
              <div className={styles.responseLabel}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 3V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Horarios de atención
              </div>
              <div className={styles.responseHours}>
                <div className={styles.hourBlock}>
                  <span className={styles.day}>Lun - Vie</span>
                  <span className={styles.time}>9:00 - 18:00</span>
                </div>
                <div className={styles.hourBlock}>
                  <span className={styles.day}>Sábado</span>
                  <span className={styles.time}>10:00 - 14:00</span>
                </div>
              </div>
            </div>

            {/* Redes sociales */}
            <div className={styles.contactSocial}>
              <a href="#" className={styles.socialCircle} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="13.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
              <a href="#" className={styles.socialCircle} aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12 3H10.5C9.11929 3 8 4.11929 8 5.5V7.5H6V10.5H8V15.5H11V10.5H13L13.5 7.5H11V5.5C11 5.22386 11.2239 5 11.5 5H13.5V3H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" className={styles.socialCircle} aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 7L11.5 9L8 11V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" className={styles.socialCircle} aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13 6.5C14.1935 6.5 15.3381 6.97411 16.182 7.81802C17.0259 8.66193 17.5 9.80653 17.5 11V17.5H13.5V11C13.5 10.6022 13.342 10.2206 13.0607 9.93934C12.7794 9.65804 12.3978 9.5 12 9.5C11.6022 9.5 11.2206 9.65804 10.9393 9.93934C10.658 10.2206 10.5 10.6022 10.5 11V17.5H6.5V11C6.5 9.80653 6.97411 8.66193 7.81802 7.81802C8.66193 6.97411 9.80653 6.5 11 6.5H13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 6.5H0.5V17.5H4.5V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="2.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
            </div>

            {/* Mapa mini */}
            <div className={styles.contactMap}>
              <div className={styles.mapPlaceholder}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Córdoba, Argentina
              </div>
              <div className={styles.mapPin} aria-hidden="true" />
            </div>
          </div>

          {/* Formulario */}
          <div 
            className={`${styles.contactFormWrapper} ${formVisible ? styles.visible : ''}`}
            ref={formRef}
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} noValidate>
                {/* Indicadores */}
                <div className={styles.formIndicators}>
                  <div className={styles.formIndicator}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 3V7L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Respuesta en <span className={styles.highlight}>24hs</span></span>
                  </div>
                  <div className={styles.formIndicator}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5 10L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Asesoramiento <span className={styles.highlight}>personalizado</span></span>
                  </div>
                </div>

                {/* Pills de intención */}
                <span className={styles.formStepLabel}>¿Qué necesitas?</span>
                <div className={styles.formPills}>
                  {intentOptions.map(intent => (
                    <button
                      key={intent}
                      type="button"
                      className={`${styles.formPill} ${formData.intent === intent ? styles.active : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, intent }))}
                    >
                      {intent}
                    </button>
                  ))}
                </div>

                {/* Nombre y Apellido */}
                <div className={styles.formRow}>
                  <div className={`${styles.formGroup} ${errors.name ? styles.error : ''}`}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder=" "
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? styles.error : ''}
                      />
                      <label htmlFor="name">Nombre <span className={styles.required}>*</span></label>
                      <span className={styles.inputIcon}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 14V13C2 10.2386 4.23858 8 7 8H9C11.7614 8 14 10.2386 14 13V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </span>
                      <span className={styles.successCheck}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                    {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                  </div>

                  <div className={`${styles.formGroup} ${errors.lastName ? styles.error : ''}`}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        placeholder=" "
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                      <label htmlFor="lastName">Apellido <span className={styles.required}>*</span></label>
                      <span className={styles.inputIcon}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 14V13C2 10.2386 4.23858 8 7 8H9C11.7614 8 14 10.2386 14 13V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </span>
                      <span className={styles.successCheck}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                    {errors.lastName && <span className={styles.errorMessage}>{errors.lastName}</span>}
                  </div>
                </div>

                {/* Email y Teléfono */}
                <div className={styles.formRow}>
                  <div className={`${styles.formGroup} ${errors.email ? styles.error : ''}`}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder=" "
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <label htmlFor="email">Email <span className={styles.required}>*</span></label>
                      <span className={styles.inputIcon}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 3L8 7L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </span>
                      <span className={styles.successCheck}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                    {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                  </div>

                  <div className={`${styles.formGroup} ${errors.phone ? styles.error : ''}`}>
                    <div className={styles.inputWrapper}>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder=" "
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      <label htmlFor="phone">Teléfono <span className={styles.required}>*</span></label>
                      <span className={styles.inputIcon}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 2L5 4L4 6L6 8L8 10L9 9L11 10L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </span>
                      <span className={styles.successCheck}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                    {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                  </div>
                </div>

                {/* Ciudad */}
                <div className={styles.formGroup}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder=" "
                      value={formData.city}
                      onChange={handleChange}
                    />
                    <label htmlFor="city">Ciudad</label>
                    <span className={styles.inputIcon}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 9.5C9.38071 9.5 10.5 8.38071 10.5 7C10.5 5.61929 9.38071 4.5 8 4.5C6.61929 4.5 5.5 5.61929 5.5 7C5.5 8.38071 6.61929 9.5 8 9.5Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 15C11 12.5 13.5 10 13.5 7C13.5 3.96243 11.0376 1.5 8 1.5C4.96243 1.5 2.5 3.96243 2.5 7C2.5 10 5 12.5 8 15Z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </span>
                    <span className={styles.successCheck}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Mensaje */}
                <div className={styles.formGroup}>
                  <div className={styles.inputWrapper}>
                    <textarea
                      id="message"
                      name="message"
                      placeholder=" "
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                    />
                    <label htmlFor="message">Mensaje</label>
                    <span className={styles.inputIcon}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4L8 8L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </span>
                    <span className={styles.successCheck}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Privacidad */}
                <div className={`${styles.formGroup} ${styles.checkboxGroup} ${errors.privacy ? styles.error : ''}`}>
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleChange}
                  />
                  <label htmlFor="privacy">
                    Acepto la <a href="/politica-privacidad">política de privacidad</a> y el tratamiento de mis datos.
                    <span className={styles.required}>*</span>
                  </label>
                </div>
                {errors.privacy && <span className={styles.errorMessage}>{errors.privacy}</span>}

                {/* Submit */}
                <RippleEffect>
                  <button 
                    type="submit" 
                    className={`${styles.btnSubmit} ${isSubmitting ? styles.loading : ''}`}
                    disabled={isSubmitting}
                  >
                    <span className={styles.spinner} />
                    <span className={styles.btnText}>
                      Enviar consulta
                    </span>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M10 4L15 9L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </RippleEffect>
              </form>
            ) : (
              /* Success State */
              <div className={`${styles.submitSuccess} ${styles.show}`}>
                <div className={styles.successIcon}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 32L28 40L44 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className={styles.successTitle}>¡Mensaje enviado!</h3>
                <p className={styles.successText}>
                  Gracias por contactarnos. Te responderemos a la brevedad.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}