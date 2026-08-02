import { useRef, useState } from 'preact/hooks';
import { contactFieldConfigs } from '../data/contactFieldConfigs';
import { useReveal } from '../hooks/useReveal';
import { faIcon, listOf, textOf, useSiteContent } from '../lib/content';

const INTENTS = [
  { value: 'comprar', icon: 'fas fa-home', label: 'Quiero comprar' },
  { value: 'vender', icon: 'fas fa-hand-holding-usd', label: 'Quiero vender' },
  { value: 'alquilar', icon: 'fas fa-key', label: 'Quiero alquilar' },
  { value: 'invertir', icon: 'fas fa-chart-line', label: 'Quiero invertir' },
  { value: 'tasar', icon: 'fas fa-calculator', label: 'Quiero tasar' },
  { value: 'desarrollador', icon: 'fas fa-building', label: 'Soy desarrollador' },
  { value: 'otro', icon: 'fas fa-ellipsis-h', label: 'Otro' },
];

const REQUIRED_BASE_FIELDS = ['nombre', 'apellido', 'email', 'telefono', 'ciudad'];

interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

function fileIcon(type: string): string {
  if (type.includes('pdf')) return 'fa-file-pdf';
  if (type.includes('image')) return 'fa-file-image';
  return 'fa-file';
}

export function Contact() {
  const rootRef = useReveal<HTMLElement>('.contact-info, .contact-form-wrapper', {
    threshold: 0.1,
    rootMargin: '0px',
  });
  const { content, settings } = useSiteContent();

  const section = content.contacto ?? {};
  const label = textOf(section.label, 'text', 'Contacto');
  const title = textOf(section.title, 'text', 'Hablemos sobre tu próxima propiedad.');
  const description = textOf(
    section.description,
    'text',
    'Ya sea para vender, alquilar, tasar o encontrar una propiedad, nuestro equipo está listo para acompañarte.',
  );

  const contactInfo = listOf(section.info).map((item) => ({
    icon: faIcon(textOf(item, 'icon')),
    label: textOf(item, 'label'),
    value: textOf(item, 'value'),
  }));

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
    const cls = ['form-group'];
    if (errors[name]) cls.push('error');
    else if (tried && values[name]?.trim()) cls.push('success');
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

  const handleSubmit = (e: Event) => {
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

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 2000);
  };

  return (
    <section className="contact" id="contacto" aria-label="Contacto" ref={rootRef}>
      <div className="container">
        <header className="contact-header">
          <span className="contact-label">{label}</span>
          <h2 className="contact-title">{title}</h2>
          <p className="contact-desc">{description}</p>
          <button className="btn-contact-secondary">
            Agendar una reunión <i className="fas fa-arrow-right"></i>
          </button>
        </header>

        <div className="contact-layout">
          <div className="contact-info" id="contactInfo">
            <h3 className="contact-info-title">Contacto directo</h3>
            {contactInfo.map((item) => (
              <div className="contact-info-item" key={item.label}>
                <span className="icon">
                  <i className={item.icon}></i>
                </span>
                <div className="content">
                  <span className="label">{item.label}</span>
                  <span className="value">{item.value}</span>
                </div>
              </div>
            ))}
            <div className="contact-response">
              <div className="response-label">
                <i className="fas fa-clock"></i> Tiempo de respuesta
              </div>
              <p className="response-text">
                Respondemos todas las consultas en menos de 24 horas hábiles.
              </p>
              <div className="response-hours">
                <div className="hour-block">
                  <span className="day">Lunes a Viernes</span>
                  <span className="time">{textOf(hours, 'weekdays', '09:00 - 18:00')}</span>
                </div>
                <div className="hour-block">
                  <span className="day">Sábados</span>
                  <span className="time">{textOf(hours, 'saturdays', '09:00 - 13:00')}</span>
                </div>
              </div>
            </div>
            <div className="contact-social">
              <button className="social-circle" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </button>
              <button className="social-circle" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </button>
              <button className="social-circle" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </button>
              <button className="social-circle" aria-label="WhatsApp">
                <i className="fab fa-whatsapp"></i>
              </button>
            </div>
            <div className="contact-map">
              <div className="map-placeholder">
                <i className="fas fa-map"></i>
                <span>Mapa interactivo</span>
              </div>
              <div className="map-pin"></div>
            </div>
          </div>

          <div className="contact-form-wrapper" id="contactFormWrapper">
            {submitted ? (
              <div className="submit-success show" id="submitSuccess">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="success-title">¡Consulta enviada!</div>
                <div className="success-text">
                  Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas.
                </div>
              </div>
            ) : (
              <>
                <div className="form-indicators">
                  <div className="form-indicator">
                    <i className="fas fa-star"></i>
                    <span>
                      <span className="highlight">★★★★★</span> Atención personalizada
                    </span>
                  </div>
                  <div className="form-indicator">
                    <i className="fas fa-clock"></i>
                    <span>
                      <span className="highlight">24h</span> Tiempo de respuesta
                    </span>
                  </div>
                  <div className="form-indicator">
                    <i className="fas fa-check-circle"></i>
                    <span>
                      <span className="highlight">100%</span> Asesoramiento profesional
                    </span>
                  </div>
                </div>
                <form id="contactForm" noValidate onSubmit={handleSubmit}>
                  <span className="form-step-label">¿Cómo podemos ayudarte?</span>
                  <div className="form-pills" id="formPills">
                    {INTENTS.map((intentOption) => (
                      <button
                        type="button"
                        key={intentOption.value}
                        className={`form-pill${intent === intentOption.value ? ' active' : ''}`}
                        data-value={intentOption.value}
                        onClick={() => setIntent(intentOption.value)}
                      >
                        <i className={intentOption.icon}></i> {intentOption.label}
                      </button>
                    ))}
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={groupClass('nombre')} style={{ animationDelay: '0.1s' }}>
                      <label>
                        Nombre <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input type="text" name="nombre" placeholder="Tu nombre" required />
                        <i className="fas fa-check-circle success-check"></i>
                      </div>
                      <span className="error-message">Por favor ingresá tu nombre</span>
                    </div>
                    <div className={groupClass('apellido')} style={{ animationDelay: '0.15s' }}>
                      <label>
                        Apellido <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input type="text" name="apellido" placeholder="Tu apellido" required />
                        <i className="fas fa-check-circle success-check"></i>
                      </div>
                      <span className="error-message">Por favor ingresá tu apellido</span>
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className={groupClass('email')} style={{ animationDelay: '0.2s' }}>
                      <label>
                        Correo electrónico <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input type="email" name="email" placeholder="tu@email.com" required />
                        <i className="fas fa-check-circle success-check"></i>
                      </div>
                      <span className="error-message">Por favor ingresá un correo válido</span>
                    </div>
                    <div className={groupClass('telefono')} style={{ animationDelay: '0.25s' }}>
                      <label>
                        Teléfono <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input type="tel" name="telefono" placeholder="+54 9 387 000-0000" required />
                        <i className="fas fa-check-circle success-check"></i>
                      </div>
                      <span className="error-message">Por favor ingresá tu teléfono</span>
                    </div>
                  </div>
                  <div className={groupClass('ciudad')} style={{ animationDelay: '0.3s' }}>
                    <label>
                      Ciudad <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <i className="fas fa-map-marker-alt input-icon"></i>
                      <input type="text" name="ciudad" placeholder="¿En qué ciudad estás?" required />
                      <i className="fas fa-check-circle success-check"></i>
                    </div>
                    <span className="error-message">Por favor ingresá tu ciudad</span>
                  </div>

                  <div id="dynamicFields">
                    {config.fields.map((field, index) => (
                      <div className="form-group" style={{ animationDelay: `${0.35 + index * 0.05}s` }} key={field.name}>
                        <label>{field.label}</label>
                        <div className="input-wrapper">
                          <i className={`${field.icon} input-icon`}></i>
                          {field.type === 'select' ? (
                            <select name={field.name}>
                              {field.options?.map((opt) => (
                                <option value={opt} key={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              name={field.name}
                              placeholder={field.placeholder || ''}
                              rows={3}
                            ></textarea>
                          ) : (
                            <input type="text" name={field.name} placeholder={field.placeholder || ''} />
                          )}
                          <i className="fas fa-check-circle success-check"></i>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ animationDelay: '0.4s' }}>
                    <label>Mensaje</label>
                    <div className="input-wrapper">
                      <i className="fas fa-comment input-icon"></i>
                      <textarea name="mensaje" placeholder="Contanos un poco más sobre lo que necesitás..."></textarea>
                    </div>
                  </div>

                  <div className="form-group" style={{ animationDelay: '0.45s' }}>
                    <label>Adjuntar archivos</label>
                    <div
                      className={`drop-zone${dragOver ? ' dragover' : ''}`}
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
                      <div className="drop-icon">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <div className="drop-text">
                        Arrastrá archivos aquí o hacé clic para seleccionarlos
                      </div>
                      <div className="drop-hint">PDF, JPG, PNG · Máximo 10MB</div>
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
                      <div className="file-list" id="fileList">
                        {files.map((file) => (
                          <div className="file-item" key={file.name}>
                            <i className={`fas ${fileIcon(file.type)}`}></i>
                            <span>{file.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              {(file.size / 1024).toFixed(0)}KB
                            </span>
                            <span
                              className="remove-file"
                              onClick={() => removeFile(file.name)}
                            >
                              <i className="fas fa-times"></i>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className={`checkbox-group form-group${errors.privacy ? ' error' : ''}`}
                    style={{ animationDelay: '0.5s' }}
                  >
                    <input type="checkbox" id="privacy" name="privacy" required />
                    <label htmlFor="privacy">
                      Acepto la <a href="#">Política de Privacidad</a> <span className="required">*</span>
                    </label>
                  </div>

                  <button type="submit" className={`btn-submit${loading ? ' loading' : ''}`} id="submitBtn" disabled={loading}>
                    <span className="btn-text">ENVIAR CONSULTA</span>
                    <i className="fas fa-arrow-right"></i>
                    <span className="spinner"></span>
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
