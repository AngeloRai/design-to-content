import LogoLight from "../icons/LogoLight";
import { ReactSVG } from "react-svg";
import Image from "next/image";
import { AssetFields } from "contentful";

const LogoComponent = ({ logo }: { logo: AssetFields }) => {
  const logoUrl = logo.file?.url;
  const logoTitle = logo?.title || "Logo";
  const logoFileName = logo.file?.fileName || "";
  const isLogoSvg = logoFileName.toLowerCase().endsWith(".svg");
  if (!logoUrl) {
    return <LogoLight className="h-14 w-auto" />;
  }

  if (isLogoSvg) {
    return (
      <ReactSVG
        src={logoUrl}
        className="h-14 w-auto"
        style={{ height: "56px", width: "auto" }}
        beforeInjection={(svg) => {
          svg.setAttribute("aria-label", logoTitle);
          svg.setAttribute("role", "img");
          svg.classList.add("h-14", "w-auto");
        }}
        fallback={() => (
          <Image
            src={logoUrl}
            alt={logoTitle}
            width={56}
            height={56}
            className="h-14 w-auto"
            priority
            style={{ height: "56px", width: "auto" }}
          />
        )}
      />
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={logoTitle}
      width={56}
      height={56}
      className="h-14 w-auto"
      priority
      style={{ height: "56px", width: "auto" }}
    />
  );
};

export default LogoComponent;
