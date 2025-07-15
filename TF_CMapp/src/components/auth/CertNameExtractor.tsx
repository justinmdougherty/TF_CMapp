import React, { useState, useEffect } from "react";
import certificateService from "../../services/certificateService";

interface CertNameExtractorProps {
  // If true, output the first name in proper case (e.g. "John" instead of "JOHN").
  firstName?: boolean;
  // If true, output the last name in proper case (e.g. "Doe" instead of "DOE").
  lastName?: boolean;
  // Optionally, render the extracted name in a read-only input field.
  renderAsInput?: boolean;
}

// Helper function to convert a string to proper case.
const toProperCase = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const CertNameExtractor: React.FC<CertNameExtractorProps> = ({
  firstName = false,
  lastName = false,
  renderAsInput = false,
}) => {
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        // Get user info from certificateService
        const userInfo = await certificateService.getCurrentUser();

        if (userInfo.certificateInfo.subject) {
          // Extract the common name from the certificate subject
          const commonName = userInfo.certificateInfo.subject;

          // Process the name based on props
          let extractedName = commonName;

          // Assume the extracted name is in the format "LAST.FIRST.MIDDLE.ID"
          if (commonName.includes(".")) {
            const parts = commonName.split(".");
            if (parts.length >= 2) {
              // parts[0] is the last name and parts[1] is the first name.
              const firstNameExtracted = parts[1];
              const lastNameExtracted = parts[0];

              if (firstName && lastName) {
                // Both firstName and lastName props are true: output "First Last"
                extractedName = `${toProperCase(
                  firstNameExtracted
                )} ${toProperCase(lastNameExtracted)}`;
              } else if (firstName && !lastName) {
                // Only firstName prop is true: output "First"
                extractedName = toProperCase(firstNameExtracted);
              } else if (!firstName && lastName) {
                // Only lastName prop is true: output "Last"
                extractedName = toProperCase(lastNameExtracted);
              } else {
                // No props provided: output as-is "FIRST LAST"
                extractedName = `${firstNameExtracted} ${lastNameExtracted}`;
              }
            }
          }

          // const funnySayings: { [key: number]: string } = {
          //   0: "Relax, it's Sunday! ",
          //   1: "Ugh, it's Monday again! ",
          //   2: "Taco Tuesday! ",
          //   3: "Hump Day! ",
          //   4: "Almost Friday! ",
          //   5: "TGIF! ",
          //   6: "Party time, it's Saturday! ",
          // };
          // const today = new Date().getDay();
          // const funnySaying = funnySayings[today];

          // setUserName(`${funnySaying}${extractedName}`);

            const greetings = [
            //"Hello (English)",
            "Welcome",
            // "Hi (English)",
            // "Greetings (English)",
            // "Hola (Spanish)",
            // "Bonjour (French)",
            // "Ciao (Italian)",
            // "Hallo (German)",
            // "Olá (Portuguese)",
            // "Привет (Russian)",
            // "Ahoy (Czech)",
            // "Aloha (Hawaiian)",
            // "Namaste (Hindi)",
            // "Salaam (Arabic)",
            // "Shalom (Hebrew)",
            // "Konnichiwa (Japanese)",
            // "Merhaba (Turkish)",
            // "Hej (Swedish)",
            // "Hei (Norwegian)",
            // "Ahoj (Slovak)",
            // "Salut (Romanian)",
            // "Szia (Hungarian)",
            // "Zdravstvuyte (Russian)",
            ];
          const randomGreeting =
            greetings[Math.floor(Math.random() * greetings.length)];
          const greeting = `${randomGreeting}, `;

          setUserName(`${greeting}${extractedName}`);
        } else {
          setUserName("Name not found");
        }
      } catch (error) {
        console.error("Error getting user information:", error);
        setUserName("Error retrieving name");
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, [firstName, lastName]);

  return (
    <div>
      {!loading ? (
        renderAsInput ? (
          <input type="text" value={userName} readOnly />
        ) : (
          <p>{userName}</p>
        )
      ) : (
        <p>Loading certificate...</p>
      )}
    </div>
  );
};

export default CertNameExtractor;
