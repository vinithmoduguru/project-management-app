import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  // Render First project's page on landing as of now
  useEffect(() => {
    void router.push("/project/1");
  }, []);

  return <></>;
}
