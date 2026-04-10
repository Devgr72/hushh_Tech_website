import { useEffect, useState, type MouseEvent } from "react";
import { useBreakpointValue } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import HushhTechCta, {
  HushhTechCtaVariant,
} from "../hushh-tech-cta/HushhTechCta";
import type { WalletPreviewModel } from "../../services/walletPass";

interface WalletCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: WalletPreviewModel | null;
  appleWalletSupported: boolean;
  appleWalletSupportMessage: string;
  onAddToAppleWallet?: () => void | Promise<void>;
  isApplePassLoading?: boolean;
  googleWalletAvailable: boolean;
  googleWalletSupportMessage: string;
  onAddToGoogleWallet?: () => void | Promise<void>;
  isGooglePassLoading?: boolean;
}

function formatPreviewMembershipId(membershipId: string) {
  const trimmedMembershipId = membershipId.trim();

  if (trimmedMembershipId.length <= 28) {
    return trimmedMembershipId;
  }

  return `${trimmedMembershipId.slice(0, 18)}…${trimmedMembershipId.slice(-6)}`;
}

function getHolderNameTypography(holderName: string) {
  const normalizedName = holderName.trim().replace(/\s+/g, " ");
  const words = normalizedName.length > 0 ? normalizedName.split(" ") : [];
  const nameLength = normalizedName.length;
  const longestWordLength = words.reduce(
    (longest, word) => Math.max(longest, word.length),
    0
  );

  if (nameLength > 32 || longestWordLength > 12 || words.length > 3) {
    return {
      fontSize: "clamp(1.12rem, 0.94rem + 1vw, 1.9rem)",
      lineHeight: "1.12",
      minHeight: "calc(1.12em * 2)",
    };
  }

  if (nameLength > 18 || longestWordLength > 8 || words.length > 1) {
    return {
      fontSize: "clamp(1.32rem, 1rem + 1.65vw, 2.35rem)",
      lineHeight: "1.1",
      minHeight: "calc(1.1em * 2)",
    };
  }

  return {
    fontSize: "clamp(1.7rem, 1.05rem + 3vw, 3.35rem)",
    lineHeight: "1.04",
    minHeight: "calc(1.04em * 2)",
  };
}

interface PreviewInfoRowProps {
  icon: string;
  label: string;
  value: string;
  href?: string | null;
  testId?: string;
  valueTestId?: string;
}

function PreviewInfoRow({
  icon,
  label,
  value,
  href,
  testId,
  valueTestId,
}: PreviewInfoRowProps) {
  const commonClasses = [
    "w-full flex items-start gap-4 py-5 border-b border-gray-200 text-left",
    href ? "transition-colors hover:bg-gray-50" : "",
  ]
    .join(" ")
    .trim();

  const content = (
    <>
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-gray-700 text-lg"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-gray-900 block mb-1">
          {label}
        </span>
        <span
          data-testid={valueTestId}
          className="text-sm text-gray-600 font-medium leading-relaxed break-all"
        >
          {value}
        </span>
      </div>
      {href ? (
        <span
          className="material-symbols-outlined text-gray-400 text-lg shrink-0 mt-1"
          style={{ fontVariationSettings: "'wght' 400" }}
        >
          arrow_outward
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={testId}
        className={commonClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <div data-testid={testId} className={commonClasses}>
      {content}
    </div>
  );
}

export default function WalletCardPreviewModal({
  isOpen,
  onClose,
  preview,
  appleWalletSupported,
  appleWalletSupportMessage,
  onAddToAppleWallet,
  isApplePassLoading = false,
  googleWalletAvailable,
  googleWalletSupportMessage,
  onAddToGoogleWallet,
  isGooglePassLoading = false,
}: WalletCardPreviewModalProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [supportsInteractiveTilt, setSupportsInteractiveTilt] = useState(false);
  const qrFrameSize = useBreakpointValue({ base: 98, sm: 112, md: 128 }) ?? 98;
  const qrPadding = useBreakpointValue({ base: 9, sm: 10, md: 12 }) ?? 9;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tiltSupportQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePreferences = () => {
      setReducedMotion(reducedMotionQuery.matches);
      setSupportsInteractiveTilt(tiltSupportQuery.matches);
    };

    updatePreferences();

    if (
      typeof reducedMotionQuery.addEventListener === "function" &&
      typeof tiltSupportQuery.addEventListener === "function"
    ) {
      reducedMotionQuery.addEventListener("change", updatePreferences);
      tiltSupportQuery.addEventListener("change", updatePreferences);
      return () => {
        reducedMotionQuery.removeEventListener("change", updatePreferences);
        tiltSupportQuery.removeEventListener("change", updatePreferences);
      };
    }

    reducedMotionQuery.addListener(updatePreferences);
    tiltSupportQuery.addListener(updatePreferences);
    return () => {
      reducedMotionQuery.removeListener(updatePreferences);
      tiltSupportQuery.removeListener(updatePreferences);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !isOpen || !preview) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, preview]);

  useEffect(() => {
    if (typeof document === "undefined" || !isOpen || !preview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, preview]);

  if (!isOpen || !preview) {
    return null;
  }

  const previewMembershipId = formatPreviewMembershipId(preview.membershipId);
  const holderNameTypography = getHolderNameTypography(preview.holderName);
  const qrSize = qrFrameSize - qrPadding * 2;
  const hasPublicProfileUrl = Boolean(preview.profileUrl);
  const enableCardTilt = supportsInteractiveTilt && !reducedMotion;
  const modalAppleSupportMessage = appleWalletSupportMessage
    ? "On iPhone, in Wallet-supported browsers."
    : appleWalletSupportMessage;
  const modalGoogleSupportMessage = googleWalletSupportMessage
    ? "Google Wallet soon."
    : googleWalletSupportMessage;
  const profileLinkDescription = hasPublicProfileUrl
    ? preview.profileUrl || ""
    : "Shared soon";

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!enableCardTilt) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const rotateY = ((offsetX / rect.width) - 0.5) * 10;
    const rotateX = (0.5 - offsetY / rect.height) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const appleCtaVariant = HushhTechCtaVariant.BLACK;
  const googleCtaVariant = appleWalletSupported
    ? HushhTechCtaVariant.WHITE
    : HushhTechCtaVariant.BLACK;

  return (
    <>
      <div
        data-testid="wallet-preview-backdrop"
        className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 sm:px-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-preview-title"
          className="relative w-full max-w-[42rem] bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.04)] border border-gray-100/50 flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <h2
              id="wallet-preview-title"
              className="text-[1.75rem] leading-[1.15] text-black tracking-tight font-serif"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Preview Card
            </h2>
            <button
              type="button"
              data-testid="wallet-preview-done"
              onClick={onClose}
              className="text-xs font-bold uppercase tracking-widest text-black hover:underline"
            >
              Done
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8">
            <section className="py-6">
              <div style={{ perspective: "1600px" }}>
                <div
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  data-testid="wallet-preview-shell"
                  data-tilt-enabled={enableCardTilt ? "true" : "false"}
                  style={{
                    transform: enableCardTilt
                      ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.01, 1.01, 1.01)`
                      : "none",
                    transition: enableCardTilt ? "transform 120ms ease-out" : "none",
                    transformStyle: enableCardTilt ? "preserve-3d" : undefined,
                  }}
                >
                  <div
                    className="relative mx-auto w-full max-w-[32rem] overflow-hidden border"
                    style={{
                      aspectRatio: "1.586",
                      borderRadius: "28px",
                      padding: "clamp(1rem, 0.8rem + 1vw, 1.5rem)",
                      background:
                        "linear-gradient(135deg, #443317 0%, #8D6B2F 34%, #D4AF37 62%, #8A6124 100%)",
                      color: "#0B1120",
                      borderColor: "rgba(255,255,255,0.35)",
                      boxShadow:
                        "0 28px 80px rgba(15, 23, 42, 0.28), inset 0 1px 10px rgba(255, 255, 255, 0.35), inset 0 -24px 44px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-[10px] rounded-[22px] border"
                      style={{ borderColor: "rgba(255,255,255,0.24)" }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at 16% 14%, rgba(255,255,255,0.55), transparent 38%), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.22), transparent 30%)",
                      }}
                    />

                    <div
                      className="grid h-full"
                      style={{
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gridTemplateRows: "auto minmax(0, 1fr) auto",
                        columnGap: "clamp(0.75rem, 0.55rem + 0.5vw, 1rem)",
                        rowGap: "clamp(0.75rem, 0.55rem + 0.5vw, 1rem)",
                      }}
                    >
                      <div className="min-w-0 flex flex-col items-start gap-1.5">
                        <p
                          className="font-bold truncate"
                          style={{
                            fontSize: "clamp(0.7rem, 0.58rem + 0.5vw, 0.9rem)",
                            letterSpacing: "clamp(0.18em, 0.12em + 0.3vw, 0.34em)",
                            color: "rgba(11, 17, 32, 0.58)",
                          }}
                        >
                          {preview.badgeText}
                        </p>
                        <p
                          className="font-semibold leading-tight"
                          style={{
                            fontSize: "clamp(0.95rem, 0.82rem + 0.7vw, 1.5rem)",
                            lineHeight: 1.1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {preview.title}
                        </p>
                      </div>

                      <div
                        className="justify-self-end self-start rounded-full border backdrop-blur-md"
                        style={{
                          padding:
                            "clamp(0.375rem, 0.28rem + 0.3vw, 0.5rem) clamp(0.75rem, 0.6rem + 0.6vw, 1rem)",
                          background: "rgba(255,255,255,0.18)",
                          borderColor: "rgba(255,255,255,0.28)",
                          maxWidth: "10.75rem",
                        }}
                      >
                        <p
                          className="text-center font-bold truncate"
                          style={{
                            fontSize: "clamp(0.62rem, 0.56rem + 0.26vw, 0.84rem)",
                            letterSpacing: "0.12em",
                          }}
                        >
                          GOLD MEMBER
                        </p>
                      </div>

                      <div
                        className="min-w-0 flex flex-col items-start justify-start gap-1.5 pt-1"
                        style={{ gridColumn: "1", gridRow: "2" }}
                      >
                        <p
                          data-testid="wallet-preview-holder-name"
                          className="font-bold"
                          style={{
                            fontSize: holderNameTypography.fontSize,
                            color: "rgba(11, 17, 32, 0.9)",
                            textShadow: "0 1px 0 rgba(255, 255, 255, 0.45)",
                            lineHeight: holderNameTypography.lineHeight,
                            minHeight: holderNameTypography.minHeight,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {preview.holderName}
                        </p>
                        <p
                          className="truncate"
                          style={{
                            fontSize: "clamp(0.9rem, 0.76rem + 0.65vw, 1.2rem)",
                            color: "rgba(11, 17, 32, 0.74)",
                          }}
                        >
                          {preview.organizationName}
                        </p>
                        <p
                          data-testid="wallet-preview-membership-id"
                          className="truncate font-semibold"
                          style={{
                            fontSize: "clamp(0.72rem, 0.66rem + 0.3vw, 0.96rem)",
                            color: "rgba(11, 17, 32, 0.68)",
                          }}
                        >
                          Membership ID · {previewMembershipId}
                        </p>
                      </div>

                      <div
                        className="min-w-0 flex flex-col items-start justify-end gap-2"
                        style={{ gridColumn: "1", gridRow: "3" }}
                      >
                        <div
                          className="max-w-full rounded-full border"
                          style={{
                            padding:
                              "clamp(0.375rem, 0.28rem + 0.3vw, 0.5rem) clamp(0.75rem, 0.6rem + 0.6vw, 1rem)",
                            background: "rgba(255,255,255,0.16)",
                            borderColor: "rgba(255,255,255,0.24)",
                          }}
                        >
                          <p
                            className="truncate font-bold"
                            style={{
                              fontSize: "clamp(0.65rem, 0.6rem + 0.24vw, 0.88rem)",
                            }}
                          >
                            Investor - {preview.investmentClass}
                          </p>
                        </div>
                        <p
                          className="truncate"
                          style={{
                            fontSize: "clamp(0.74rem, 0.69rem + 0.24vw, 0.95rem)",
                            color: "rgba(11, 17, 32, 0.7)",
                          }}
                        >
                          {preview.email}
                        </p>
                      </div>

                      <div
                        data-testid="wallet-preview-qr"
                        className="justify-self-end self-end"
                        style={{
                          gridColumn: "2",
                          gridRow: "3",
                          width: `${qrFrameSize}px`,
                          height: `${qrFrameSize}px`,
                          background: "rgba(255,255,255,0.92)",
                          borderRadius: qrFrameSize >= 128 ? "22px" : "18px",
                          padding: `${qrPadding}px`,
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
                        }}
                      >
                        <div style={{ width: `${qrSize}px`, height: `${qrSize}px` }}>
                          <QRCodeSVG
                            value={preview.qrValue}
                            size={qrSize}
                            bgColor="#FFFFFF"
                            fgColor="#0B1120"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-0">
              <PreviewInfoRow
                icon="badge"
                label="Membership ID"
                value={preview.membershipId}
              />
              <PreviewInfoRow icon="mail" label="Email" value={preview.email} />
              <PreviewInfoRow
                icon="link"
                label="Profile Link"
                value={profileLinkDescription}
                href={hasPublicProfileUrl ? preview.profileUrl : null}
                testId="wallet-preview-profile-link"
                valueTestId="wallet-preview-profile-url"
              />
            </section>

            <section className="pt-8 pb-2 space-y-3">
              {appleWalletSupported ? (
                <HushhTechCta
                  variant={appleCtaVariant}
                  onClick={onAddToAppleWallet}
                  disabled={isApplePassLoading}
                  aria-label="Add to Apple Wallet"
                >
                  {isApplePassLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <>
                      <FaApple className="text-lg" />
                      <span>Add to Apple Wallet</span>
                    </>
                  )}
                </HushhTechCta>
              ) : null}

              {googleWalletAvailable ? (
                <HushhTechCta
                  variant={googleCtaVariant}
                  onClick={onAddToGoogleWallet}
                  disabled={isGooglePassLoading}
                  aria-label="Add to Google Wallet"
                >
                  {isGooglePassLoading ? (
                    <>
                      <div
                        className={`animate-spin h-4 w-4 border-2 rounded-full ${
                          googleCtaVariant === HushhTechCtaVariant.BLACK
                            ? "border-white/30 border-t-white"
                            : "border-black/20 border-t-black"
                        }`}
                      />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <>
                      <FcGoogle className="text-lg" />
                      <span>Add to Google Wallet</span>
                    </>
                  )}
                </HushhTechCta>
              ) : null}

              {!appleWalletSupported ? (
                <p className="text-xs text-gray-500 font-light text-center">
                  {modalAppleSupportMessage}
                </p>
              ) : null}

              {!googleWalletAvailable ? (
                <p className="text-xs text-gray-500 font-light text-center">
                  {modalGoogleSupportMessage}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
