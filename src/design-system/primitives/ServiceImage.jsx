import { useState } from 'react';
import { Wrench } from 'lucide-react';

export function ServiceImage({ src, alt, style, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  if (!src || failedSource === src) return <div role="img" aria-label={`${alt}: photo unavailable`} className="service-image-placeholder" style={style}><Wrench size={36} aria-hidden="true" /><span>Service photo unavailable</span></div>;
  return <img {...props} src={src} alt={alt} style={style} onError={() => setFailedSource(src)} />;
}
