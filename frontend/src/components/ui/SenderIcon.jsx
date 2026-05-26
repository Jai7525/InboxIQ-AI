import { useEffect, useMemo, useState } from "react";

const logoSources = {
  clearbitExact: "clearbit-exact",
  clearbitRoot: "clearbit-root",
  google: "google",
  initials: "initials",
};

const twoPartTlds = new Set(["co.in", "edu.in", "ac.in", "gov.in", "co.uk", "com.au"]);
const genericLabels = new Set([
  "mail",
  "email",
  "accounts",
  "notifications",
  "notification",
  "notify",
  "support",
  "news",
  "updates",
  "hello",
  "team",
  "noreply",
  "no-reply",
  "welcome",
  "welcomeemail",
  "registration",
  "register",
  "admin",
]);
const marketingSuffixes = ["mailer", "mails", "mail", "emails", "email", "newsletter", "news", "notifications", "notification", "updates", "update"];
const knownDomainAliases = {
  "nse.co.in": ["nseindia.com", "nse.com", "nse.in"],
};
const initialsOnlyPrefixes = ["welcome", "registration", "register"];
const personalMailboxDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
]);

function extractEmail(value = "") {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).replace(/^mailto:/i, "").trim();
}

function extractDomain(value = "") {
  const email = extractEmail(value).toLowerCase();
  const domain = email.includes("@") ? email.split("@").pop() : email;
  return domain && domain.includes(".") ? domain.replace(/^[<("']+|[>,)"'\s].*$/g, "").replace(/^www\./, "") : "";
}

function getRootDomain(domain = "") {
  const parts = domain.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return domain;
  }

  const suffix = parts.slice(-2).join(".");
  const size = twoPartTlds.has(suffix) ? 3 : 2;
  return parts.slice(-size).join(".");
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function cleanSenderName(value = "") {
  return value.replace(/<[^>]+>/g, "").replaceAll('"', "").trim();
}

function getBrandLabelFromName(name = "") {
  const cleaned = cleanSenderName(name)
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.includes("@")) {
    return "";
  }

  const fromMatch = cleaned.match(/\b(?:from|via|by)\s+(.+)$/i);
  const brand = (fromMatch?.[1] || cleaned)
    .split(/\s+[|-]\s+/)[0]
    .replace(/\b(team|notifications?|updates?|support|careers?|hello)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return brand.length > 1 ? brand : "";
}

function slugBrand(value = "") {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(inc|llc|ltd|limited|private|pvt|team|official)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function domainFromBrand(name = "") {
  const slug = slugBrand(getBrandLabelFromName(name));

  if (!slug || genericLabels.has(slug) || slug.length < 2 || slug.length > 32) {
    return [];
  }

  return [`${slug}.com`];
}

function removeMarketingSuffix(label = "") {
  let cleaned = label;

  marketingSuffixes.forEach((suffix) => {
    cleaned = cleaned.replace(new RegExp(`${suffix}$`, "i"), "");
  });

  return cleaned;
}

function domainVariants(domain = "", rootDomain = "") {
  const root = rootDomain || domain;
  const [label] = root.split(".");
  const simplifiedLabel = removeMarketingSuffix(label);
  const simplifiedDomain = simplifiedLabel && simplifiedLabel !== label && simplifiedLabel.length > 2 ? `${simplifiedLabel}.com` : "";
  const tld = root.split(".").slice(1).join(".");
  const countryBrandDomains = twoPartTlds.has(tld) && label && !genericLabels.has(label)
    ? [`${label}india.com`, `${label}.com`, `${label}.in`]
    : [];

  return unique([...(knownDomainAliases[root] || []), domain, root, simplifiedDomain, ...countryBrandDomains]);
}

function getLocalPart(value = "") {
  const email = extractEmail(value).toLowerCase();
  return email.includes("@") ? email.split("@")[0].replace(/[^a-z0-9]+/g, "") : "";
}

function shouldUseInitialsOnly({ sender = "", name = "" }) {
  const cleanedName = slugBrand(cleanSenderName(name));
  const localPart = getLocalPart(sender || name);

  return [cleanedName, localPart].some((value) => initialsOnlyPrefixes.some((prefix) => value.startsWith(prefix)));
}

function getCompanyLabel(domain = "") {
  const parts = domain.split(".").filter(Boolean);
  const label = parts.find((part) => !genericLabels.has(part)) || parts[0] || "";
  return label.replace(/[-_]+/g, " ");
}

function formatInitialsSource(name = "", fallback = "", domain = "") {
  const brandName = getBrandLabelFromName(name);
  const cleanedName = cleanSenderName(name);

  if (brandName) {
    return brandName;
  }

  if (cleanedName && !cleanedName.includes("@")) {
    return cleanedName;
  }

  const email = extractEmail(fallback || name);
  const localPart = email.includes("@") ? email.split("@")[0] : "";
  return getCompanyLabel(domain) || localPart.replace(/[._-]+/g, " ") || cleanedName || "Sender";
}

function getInitials(name = "", fallback = "", domain = "") {
  const source = formatInitialsSource(name, fallback, domain);
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const compact = source.replace(/[^a-z0-9]/gi, "");
  return compact.slice(0, compact.length > 7 ? 2 : 1).toUpperCase() || "S";
}

export function SenderIcon({ sender = "", name = "", className = "", size = "md" }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const domain = useMemo(() => extractDomain(sender || name), [name, sender]);
  const rootDomain = useMemo(() => getRootDomain(domain), [domain]);
  const initials = getInitials(name, sender, domain);
  const sizes = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-10 w-10 text-sm",
  };
  const sources = useMemo(() => {
    if (!domain || personalMailboxDomains.has(rootDomain) || shouldUseInitialsOnly({ sender, name })) {
      return [{ type: logoSources.initials, url: "" }];
    }

    const domains = unique([
      ...domainFromBrand(name),
      ...domainVariants(domain, rootDomain),
    ]);
    const googleFallbacks = domains.map((logoDomain) => ({
      type: logoSources.google,
      url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(logoDomain)}&sz=64`,
    }));

    return [
      ...domains.map((logoDomain, index) => ({
        type: index === 0 ? logoSources.clearbitExact : logoSources.clearbitRoot,
        url: `https://logo.clearbit.com/${encodeURIComponent(logoDomain)}`,
      })),
      ...googleFallbacks,
      { type: logoSources.initials, url: "" },
    ];
  }, [domain, name, rootDomain, sender]);
  const currentSource = sources[sourceIndex] || sources.at(-1);
  const iconUrl = currentSource?.url || "";

  useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [domain, name, rootDomain, sender]);

  useEffect(() => {
    if (!iconUrl || loaded || currentSource?.type === logoSources.initials) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      useNextSource();
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [currentSource?.type, iconUrl, loaded, sources.length]);

  const useNextSource = () => {
    setLoaded(false);
    setSourceIndex((current) => Math.min(current + 1, sources.length - 1));
  };

  const handleImageLoad = (event) => {
    if (currentSource?.type !== logoSources.google) {
      setLoaded(true);
      return;
    }

    const { naturalHeight, naturalWidth } = event.currentTarget;

    if (naturalWidth < 24 || naturalHeight < 24) {
      useNextSource();
      return;
    }

    setLoaded(true);
  };

  if (!iconUrl || currentSource?.type === logoSources.initials) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-200 font-bold text-slate-700 shadow-sm transition duration-200 dark:border-white/10 dark:from-slate-800 dark:to-slate-950 dark:text-slate-200 ${sizes[size]} ${className}`}>
        {initials}
      </span>
    );
  }

  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white/70 shadow-sm transition duration-200 dark:border-white/10 dark:bg-white/5 ${sizes[size]} ${className}`}>
      <img
        key={iconUrl}
        src={iconUrl}
        alt="company icon"
        className="h-full w-full rounded-xl object-cover"
        onError={useNextSource}
        onLoad={handleImageLoad}
      />
    </span>
  );
}
