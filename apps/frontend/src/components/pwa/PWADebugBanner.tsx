/**
 * PWADebugBanner - Banner de debug para testar visualização
 * REMOVER após confirmar que funciona
 */

export function PWADebugBanner() {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] bg-yellow-500 text-black p-4 rounded-lg shadow-xl text-xs">
      <div className="font-bold mb-2">🐛 PWA Debug Info:</div>
      <div className="space-y-1">
        <div>User Agent: {navigator.userAgent}</div>
        <div>iOS: {isIOS ? '✅' : '❌'}</div>
        <div>Android: {isAndroid ? '✅' : '❌'}</div>
        <div>Safari: {isSafari ? '✅' : '❌'}</div>
        <div>Standalone: {isStandalone ? '✅' : '❌'}</div>
        <div>Location: {window.location.href}</div>
      </div>
    </div>
  );
}
