import React, { useState } from "react";

const Contactus = () => {
  const [expandedItems, setExpandedItems] = useState({}); // All items closed by default

  const faqItems = [
    {
      question: "Is EquiLife free to use?",
      answer: "Yes, EquiLife offers a free tier with core features. Premium features are available through optional subscriptions.",
    },
    {
      question: "How does the mental health assessment work?",
      answer:
        "Our AI-powered assessment uses scientifically validated questionnaires to evaluate stress, mood, and emotional well-being. Your results are private and used to suggest personalized coping strategies.",
    },
    {
      question: "How accurate is the nutrition calculator?",
      answer:
        "Our nutrition calculator uses trusted nutritional databases and AI algorithms to provide accurate macro and micronutrient estimates based on your inputs.",
    },
    {
      question: "Can I interact with other users?",
      answer:
        "Yes! EquiLife has a supportive community where you can share your journey, join groups, and interact with like-minded individuals while maintaining your privacy.",
    },
    {
      question: "How does AI give personalized suggestions?",
      answer:
        "Our AI analyzes your assessments, goals, fitness data, and nutrition logs to provide tailored recommendations for workouts, meal plans, and mental health strategies.",
    },
  ];

  const toggleFAQ = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="font-sans">
      {/*Navbar*/}
      <nav className="bg-white shadow-md py-2 px-28">
        <div className="container px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img
              src="/logo.jpeg"
              alt="Logo"
              className="h-8 w-8"
              loading="lazy"
            />
            <span className="text-xl font-semibold text-blue-500">
              EquiLife
            </span>
          </div>

          {/*Nav Links*/}
          <div className="flex items-center space-x-6">
            <a href="/" className="text-gray-700 hover:text-blue-500">
              Home
            </a>
            <a href="/aboutus" className="text-gray-700 hover:text-blue-500">
              About Us
            </a>
            <a href="" className="text-blue-400 font-semibold">
              Contact Us
            </a>
            <a
              href="/signin"
              className="bg-blue-600 text-white cursor-pointer px-4 py-2 rounded hover:bg-blue-700 inline-block">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/*Hero Section*/}
      <div className="relative w-full h-[60vh] bg-cover bg-center">
        <img
          src="/contactus.png"
          alt="Hero"
          className="w-full h-full brightness-80 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="max-w-xl text-center">
            <h2 className="text-5xl font-bold mb-3 max-w-[22rem]">
              Contact Us
            </h2>
          </div>
        </div>
      </div>

      {/*Cards Section*/}
      <div className="px-32 -mt-10 z-10 relative">
        <div className="flex shadow-xl bg-white rounded-xl border border-gray-200 overflow-hidden text-left divide-x divide-gray-200">
          {/* Card 1 */}
          <div className="flex items-center p-3 flex-1 space-x-4">
            <img
              src="/firstCard.png"
              alt="Expert"
              className="h-10 w-10"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-gray-800 text-base">
                Expert & Professional
              </h3>
              <p className="text-sm text-gray-600">
                Expert care, guided by ethics, delivered with precision and
                compassion.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center p-3 flex-1 space-x-4">
            <img
              src="/secondCard.png"
              alt="24×7 Emergency"
              className="h-10 w-10"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-gray-800 text-base">
                24×7 Emergency
              </h3>
              <p className="text-sm text-gray-600">
                Your emergency is our priority—expert care, anytime, day or
                night.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center p-3 flex-1 space-x-4">
            <img
              src="/thirdCard.png"
              alt="High Quality"
              className="h-10 w-10"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-gray-800 text-base">
                High Quality Work
              </h3>
              <p className="text-sm text-gray-600">
                High-quality care driven by precision, expertise, and a passion
                for medical excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Starting */}
      <div className="px-32 py-16 bg-white">
        <div className="flex items-center gap-12">
          {/* Left Image */}
          <div className="flex-1 relative">
            <img
              src="/contactForm.png"
              alt="Doctor meditating"
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
          </div>

          {/* Right Content */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get In Touch <span className="text-blue-600">With Us</span>
            </h2>

            {/* Form Here */}
            <form className="space-y-2 mb-2">
              {/* First Row: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Second Row: Email & Phone No. */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Message Textarea */}
              <textarea
                rows="3"
                placeholder="Message"
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <button className="bg-blue-600 text-white cursor-pointer px-5 py-2 mt-6 rounded hover:bg-blue-700">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ Section */}

      <section className="px-4 md:px-32 py-12">
        {/* Heading */}
        <div className="text-center mb-10 mt-3">
          <h2 className="text-3xl font-bold mb-2">
            Frequently Asked <span className="text-blue-500">Questions</span>
          </h2>
          <p className="text-black">
            These are the questions we hear more often.
          </p>
        </div>

        {/* FAQ + Side Card */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* FAQ Accordion */}
          <div className="flex-1 max-w-2xl w-full">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b">
                <button
                  onClick={() => toggleFAQ(index)}
                  className={`w-full text-left py-5 px-2 flex items-center justify-between transition-colors cursor-pointer ${
                    expandedItems[index]
                      ? "font-semibold text-blue-600"
                      : "text-black"
                  }`}>
                  <span>{item.question}</span>
                  <span className="text-xl transition-transform duration-300">
                    {expandedItems[index] ? "×" : "+"}
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedItems[index] ? "max-h-96" : "max-h-0"
                  }`}>
                  <div className="px-2 pb-5 text-gray-600 text-sm">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Side Card */}
          <div className="w-full lg:w-80 ml-16 bg-blue-50 rounded-lg p-8 flex flex-col items-center text-center shadow-sm mt-24">
            <p className="font-semibold text-lg mb-2">
              Don’t see the answer you need?
            </p>
            <p className="text-gray-500 mb-5 text-sm">
              That’s ok. Just drop a message and we will get back to you ASAP.
            </p>
            <a
              href="/signin"
              className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition inline-block cursor-pointer">
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-500 text-white w-full">
        <div className="max-w-7xl mx-auto px-32 py-12 flex flex-col md:flex-row justify-between gap-10">
          {/* Left Section */}
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <img
                src="/logo-removebg.png"
                alt="EquiLife Logo"
                className="h-14 w-14"
                loading="lazy"
              />
              <span className="font-bold text-xl">EquiLife</span>
            </div>
            <p className="text-gray-200 max-w-[18rem] leading-relaxed">
              Empowering individuals through personalized mental and physical
              wellness tools, AI-driven insights, and a compassionate community.
            </p>
          </div>

          {/* Middle Section */}
          <div className="flex-1 mt-4">
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Mental Health Assessments</li>
              <li>Fitness Tracker</li>
              <li>Nutrition Log</li>
              <li>Goal and Leadership</li>
              <li>Community Interaction</li>
            </ul>
          </div>

          {/* Right Section */}
          <div className="flex-1 mt-4">
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-center space-x-3">
                {/* Location Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                    clipRule="evenodd"
                  />
                </svg>

                <span>
                  123 Gulberg Main Blvd, Suite 100, Lahore, Punjab, Pakistan
                </span>
              </li>
              <li className="flex items-center space-x-3">
                {/* Phone Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>042-123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                {/* Envelope Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                  <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                </svg>
                <span>support@equilife.com</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Horizontal Divider */}
        <div className="max-w-6xl mx-auto px-32 border-t border-white "></div>
        {/* Copyright */}
        <div className="w-full py-4 text-center text-gray-300 text-sm">
          &copy; Copyright 2026 EquiLife | All rights reserved |{" "}
          <span>
            <a href="#" className="font-medium underline">
              Terms and Conditions
            </a>{" "}
            |{" "}
            <a href="#" className="font-medium underline">
              Privacy Policy
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Contactus;
