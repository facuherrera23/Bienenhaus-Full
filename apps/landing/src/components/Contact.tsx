import { useRef, useState } from 'preact/hooks';
import { contactFieldConfigs } from '../data/contactFieldConfigs';
import { useReveal } from '../hooks/useReveal';
import { textOf, useSiteContent } from '../lib/content';
import { useSiteSettings, getNextWhatsAppUrl } from '../lib/site-settings';
import {
  Home,
  DollarSign,
  Key,
  TrendingUp,
  Calculator,
  MoreHorizontal,
  MapPin,
  Mail,
  Clock,
  UploadCloud,
  FileText,
  Image,
  File,
  X,
  CheckCircle,
  Star,
  ArrowRight,
  Loader2,
  MessageSquare,
} from 'lucide-preact';
import {
  WhatsappIcon,
  InstagramIcon,
  FacebookIcon,
  LinkedinIcon,
} from '../lib/brand-icons';
import styles from '../styles/modules/Contact.module.css';

const INTENTS = [
  { value: 'comprar', icon: 'fa-home', label: 'Quiero comprar' },
  { value: 'vender', icon: 'fa-hand-holding-usd', label: 'Quiero vender' },
  { value: 'alquilar', icon: 'fa-key', label: 'Quiero alquilar' },
  { value: 'invertir', icon: 'fa-chart-line', label: 'Quiero invertir' },
  { value: 'tasar', icon: 'fa-calculator', label: 'Quiero tasar' },
  { value: 'otro', icon: 'fa-ellipsis-h', label: 'Otro' },
];

const REQUIRED_BASE_FIELDS = ['nombre', 'apellido', 'email', 'whatsapp', 'ciudad'];

interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

function getLucideIcon(name: string) {
  const iconMap: Record<string, any> = {
    'fa-home': Home,
    'fa-hand-holding-usd': DollarSign,
    'fa-key': Key,
    'fa-chart-line': TrendingUp,
    'fa-calculator': Calculator,
    'fa-ellipsis-h': MoreHorizontal,
  };
  return iconMap[name] || Home;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('image')) return Image;
  return File;
}

export function Contact() {
  const rootRef = useReveal<HTMLElement>('.contact-info, .contact-form-wrapper', {
    threshold: 0.1,
    rootMargin: '0px',
  });
  const { content, settings } = useSiteContent();
  const { settings: siteSettings } = useSiteSettings();
  const whatsappUrl = getNextWhatsAppUrl(siteSettings);

  const section = content.contacto ?? {};
  const label = textOf(section.label, 'text', 'Contacto');
  const title = textOf(section.title, 'text', 'Hablemos sobre tu próxima propiedad.');
  const description = textOf(
    section.description,
    'text',
    'Ya sea para vender, alquilar, tasar o encontrar una propiedad, nuestro equipo está listo para acompañarte.',
  );

  const contactInfo = [
    { icon: 'fa-map-marker-alt', label: 'Ubicación', value: siteSettings.contact.address || textOf(settings.contact_address, 'value', 'Córdoba, Argentina') },
    { icon: 'fa-envelope', label: 'Email', value: siteSettings.contact.email || textOf(settings.contact_email, 'value', 'info@bienenhaus.com') },
    { icon: 'fa-clock', label: 'Horarios', value: `Lun-Vie ${siteSettings.contact.hours?.weekdays || '09:00 - 18:00'} / Sáb ${siteSettings.contact.hours?.saturdays || '09:00 - 13:00'}` },
    { icon: 'fa-whatsapp', label: 'WhatsApp', value: whatsappUrl },
  ];

  const hours = settings.contact_hours ?? {};

  const [intent, setIntent] = useState('comprar');
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = contactFieldConfigs[intent] ?? contactFieldConfigs.otro;

  const groupClass = (name: string): string => {
    const cls = [styles.formGroup];
    if (errors[name]) cls.push(styles.error);
    else if (tried && values[name]?.trim()) cls.push(styles.success);
    return cls.join(' ');
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: AttachedFile[] = [];
    Array.from(list).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo excede el tamaño máximo de 10MB');
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        alert('Solo se permiten archivos PDF, JPG o PNG');
        return;
      }
      next.push({ name: file.name, size: file.size, type: file.type });
    });
    if (next.length) setFiles((prev) => [...prev, ...next]);
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const nextValues: Record<string, string> = {};
    formData.forEach((value, key) => {
      nextValues[key] = String(value);
    });
    setValues(nextValues);

    const nextErrors: Record<string, boolean> = {};
    REQUIRED_BASE_FIELDS.forEach((name) => {
      if (!(nextValues[name] ?? '').trim()) nextErrors[name] = true;
    });

    const privacyChecked = nextValues['privacy'] === 'on';
    if (!privacyChecked) nextErrors['privacy'] = true;

    setErrors(nextErrors);
    setTried(true);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = form.querySelector('.form-group.error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Honeypot field
    const honeypot = nextValues['website'] || '';

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: `${nextValues.nombre} ${nextValues.apellido}`,
          email: nextValues.email,
          phone: nextValues.whatsapp,
          subject: nextValues.asunto || nextValues.interes || 'Consulta web',
          message: nextValues.mensaje || '',
          website: honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.error || 'Demasiados intentos. Intente en 1 hora.');
        }
        throw new Error(data.error || 'Error enviando la consulta');
      }

      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'Error de conexión. Intente nuevamente.');
    }
  };

  return (
    <section className={styles.contact} id="contacto" aria-label="Contacto" ref={rootRef}>
      <div className="container">
        <header className={styles.contactHeader}>
          <span className={styles.contactLabel}>{label}</span>
          <h2 className={styles.contactTitle}>{title}</h2>
          <p className={styles.contactDesc}>{description}</p>
          <button className={styles.btnContactSecondary}>
            Agendar una reunión <ArrowRight className={styles.icon} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.contactLayout}>
          <div className={styles.contactInfo} id="contactInfo">
            <h3 className={styles.contactInfoTitle}>Contacto directo</h3>
            {contactInfo.map((item) => {
              const ContactIcon = getLucideIcon(item.icon);
              return (
                <div className={styles.contactInfoItem} key={item.label}>
                  <span className={styles.icon}>
                    <ContactIcon className={styles.icon} aria-hidden="true" />
                  </span>
                  <div className={styles.content}>
                    <span className={styles.label}>{item.label}</span>
                    <span className={styles.value}>{item.value}</span>
                  </div>
                </div>
              );
            })}
            <div className={styles.contactResponse}>
              <div className={styles.responseLabel}>
                <Clock className={styles.icon} aria-hidden="true" /> Tiempo de respuesta
              </div>
              <p className={styles.responseText}>
                Respondemos todas las consultas en menos de 24 horas hábiles.
              </p>
              <div className={styles.responseHours}>
                <div className={styles.hourBlock}>
                  <span className={styles.day}>Lunes a Viernes</span>
                  <span className={styles.time}>{textOf(hours, 'weekdays', '09:00 - 18:00')}</span>
                </div>
                <div className={styles.hourBlock}>
                  <span className={styles.day}>Sábados</span>
                  <span className={styles.time}>{textOf(hours, 'saturdays', '09:00 - 13:00')}</span>
                </div>
              </div>
            </div>
            <div className={styles.contactSocial}>
              <a href={siteSettings.social.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialCircle} aria-label="Instagram">
                <InstagramIcon className={styles.icon} aria-hidden={true} />
              </a>
              <a href={siteSettings.social.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialCircle} aria-label="Facebook">
                <FacebookIcon className={styles.icon} aria-hidden={true} />
              </a>
              <a href={siteSettings.social.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialCircle} aria-label="LinkedIn">
                <LinkedinIcon className={styles.icon} aria-hidden={true} />
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.socialCircle} aria-label="WhatsApp">
                <WhatsappIcon className={styles.icon} aria-hidden={true} />
              </a>
            </div>
            <div className={styles.contactMap}>
              <div className={styles.mapPlaceholder}>
                <MapPin className={styles.icon} aria-hidden="true" />
                <span>Mapa interactivo</span>
              </div>
              <div className={styles.mapPin}></div>
            </div>
          </div>

          <div className={styles.contactFormWrapper} id="contactFormWrapper">
            {submitted ? (
              <div className={`${styles.submitSuccess} ${styles.show}`} id="submitSuccess">
                <div className={styles.successIcon}>
                  <CheckCircle className={styles.icon} aria-hidden="true" />
                </div>
                <div className={styles.successTitle}>¡Consulta enviada!</div>
                <div className={styles.successText}>
                  Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas.
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formIndicators}>
                  <div className={styles.formIndicator}>
                    <Star className={styles.icon} aria-hidden="true" />
                    <span>
                      <span className={styles.highlight}>★★★★★</span> Atención personalizada
                    </span>
                  </div>
                  <div className={styles.formIndicator}>
                    <Clock className={styles.icon} aria-hidden="true" />
                    <span>
                      <span className={styles.highlight}>24h</span> Tiempo de respuesta
                    </span>
                  </div>
                  <div className={styles.formIndicator}>
                    <CheckCircle className={styles.icon} aria-hidden="true" />
                    <span>
                      <span className={styles.highlight}>100%</span> Asesoramiento profesional
                    </span>
                  </div>
                </div>
                <form id="contactForm" noValidate onSubmit={handleSubmit}>
                  <div className={styles.formPills} id="formPills">
                    {INTENTS.map((intentOption) => {
                      const IntentIcon = getLucideIcon(intentOption.icon);
                      return (
                        <button
                          type="button"
                          key={intentOption.value}
                          className={`${styles.formPill}${intent === intentOption.value ? ` ${styles.active}` : ''}`}
                          data-value={intentOption.value}
                          onClick={() => setIntent(intentOption.value)}
                        >
                          <IntentIcon className={styles.icon} aria-hidden="true" /> {intentOption.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.formRow}>
                    <div className={groupClass('nombre')} style={{ animationDelay: '0.1s' }}>
                      <label htmlFor="nombre">
                        Nombre <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} aria-hidden="true" />
                        <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" required />
                        <CheckCircle className={styles.successCheck} aria-hidden="true" />
                      </div>
                      <span className={styles.errorMessage}>Por favor ingresá tu nombre</span>
                    </div>
                    <div className={groupClass('apellido')} style={{ animationDelay: '0.15s' }}>
                      <label htmlFor="apellido">
                        Apellido <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} aria-hidden="true" />
                        <input type="text" id="apellido" name="apellido" placeholder="Tu apellido" required />
                        <CheckCircle className={styles.successCheck} aria-hidden="true" />
                      </div>
                      <span className={styles.errorMessage}>Por favor ingresá tu apellido</span>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={groupClass('email')} style={{ animationDelay: '0.2s' }}>
                      <label htmlFor="email">
                        Correo electrónico <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} aria-hidden="true" />
                        <input type="email" id="email" name="email" placeholder="tu@email.com" required />
                        <CheckCircle className={styles.successCheck} aria-hidden="true" />
                      </div>
                      <span className={styles.errorMessage}>Por favor ingresá un correo válido</span>
                    </div>
                    <div className={groupClass('whatsapp')} style={{ animationDelay: '0.25s' }}>
                      <label htmlFor="whatsapp">
                        WhatsApp / Teléfono <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <WhatsappIcon className={styles.inputIcon} aria-hidden={true} />
                        <input type="tel" id="whatsapp" name="whatsapp" placeholder="+54 9 351 000-0000" required />
                        <CheckCircle className={styles.successCheck} aria-hidden="true" />
                      </div>
                      <span className={styles.errorMessage}>Por favor ingresá tu WhatsApp</span>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={groupClass('ciudad')} style={{ animationDelay: '0.2s' }}>
                      <label htmlFor="ciudad">
                        Ciudad <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <MapPin className={styles.inputIcon} aria-hidden="true" />
                        <input type="text" id="ciudad" name="ciudad" placeholder="¿En qué ciudad estás?" required />
                        <CheckCircle className={styles.successCheck} aria-hidden="true" />
                      </div>
                      <span className={styles.errorMessage}>Por favor ingresá tu ciudad</span>
                    </div>
                  </div>

                  <div id="dynamicFields">
                    {config.fields.map((field, index) => {
                      const FieldIcon = getLucideIcon(field.icon);
                      return (
                        <div className={styles.formGroup} style={{ animationDelay: `${0.35 + index * 0.05}s` }} key={field.name}>
                          <label htmlFor={field.name}>{field.label}</label>
                          <div className={styles.inputWrapper}>
                            <FieldIcon className={styles.inputIcon} aria-hidden="true" />
                            {field.type === 'select' ? (
                              <select id={field.name} name={field.name}>
                                {field.options?.map((opt) => (
                                  <option value={opt} key={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                id={field.name}
                                name={field.name}
                                placeholder={field.placeholder || ''}
                                rows={3}
                              ></textarea>
                            ) : (
                              <input type="text" id={field.name} name={field.name} placeholder={field.placeholder || ''} />
                            )}
                            <CheckCircle className={styles.successCheck} aria-hidden="true" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.formGroup} style={{ animationDelay: '0.4s' }}>
                    <label htmlFor="mensaje">Mensaje</label>
                    <div className={styles.inputWrapper}>
                      <MessageSquare className={styles.inputIcon} aria-hidden="true" />
                      <textarea id="mensaje" name="mensaje" placeholder="Contanos un poco más sobre lo que necesitás..."></textarea>
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ animationDelay: '0.45s' }}>
                    <label htmlFor="fileInput">Adjuntar archivos</label>
                    <div
                      className={`${styles.dropZone}${dragOver ? ` ${styles.dragOver}` : ''}`}
                      id="dropZone"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer) addFiles(e.dataTransfer.files);
                      }}
                    >
                      <div className={styles.dropIcon}>
                        <UploadCloud className={styles.icon} aria-hidden="true" />
                      </div>
                      <div className={styles.dropText}>
                        Arrastrá archivos aquí o hacé clic para seleccionarlos
                      </div>
                      <div className={styles.dropHint}>PDF, JPG, PNG · Máximo 10MB</div>
                      <input
                        type="file"
                        id="fileInput"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={(e) => {
                          addFiles(e.currentTarget.files);
                          e.currentTarget.value = '';
                        }}
                      />
                    </div>
                    {files.length > 0 && (
                      <div className={styles.fileList} id="fileList">
                        {files.map((file) => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div className={styles.fileItem} key={file.name}>
                              <FileIcon className={styles.icon} aria-hidden="true" />
                              <span>{file.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--bh-text-tertiary)' }}>
                                {(file.size / 1024).toFixed(0)}KB
                              </span>
                              <span
                                className={styles.removeFile}
                                onClick={() => removeFile(file.name)}
                              >
                                <X className={styles.icon} aria-hidden="true" />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div
                    className={`${styles.checkboxGroup} ${styles.formGroup}${errors.privacy ? ` ${styles.error}` : ''}`}
                    style={{ animationDelay: '0.5s' }}
                  >
                    <input type="checkbox" id="privacy" name="privacy" required />
                    <label htmlFor="privacy">
                      Acepto la <a href="#">Política de Privacidad</a> <span className={styles.required}>*</span>
                    </label>
                  </div>

                  {/* Honeypot - invisible to humans */}
                  <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

                  <button type="submit" className={`${styles.btnSubmit}${loading ? ` ${styles.loading}` : ''}`} id="submitBtn" disabled={loading}>
                    <span className={styles.btnText}>{loading ? 'ENVIANDO...' : 'ENVIAR CONSULTA'}</span>
                    <ArrowRight className={styles.icon} aria-hidden="true" />
                    <Loader2 className={styles.spinner} aria-hidden="true" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}