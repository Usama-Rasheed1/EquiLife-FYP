import React, { useState } from "react";

const LandingPage = () => {
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
      <nav className="bg-white shadow-lg py-3 px-28 sticky top-0 z-50">
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
            <a href="/" className="text-blue-500 font-semibold hover:text-blue-700 cursor-not-allowed pointer-events-none">
              Home
            </a>
            <a href="/aboutus" className="text-gray-700 hover:text-blue-500">
              About Us
            </a>
            <a href="/contactus" className="text-gray-700 hover:text-blue-500">
              Contact Us
            </a>
            <button
              onClick={() => {
                window.location.href = "/signin";
              }}
              className="bg-blue-600 text-white cursor-pointer px-4 py-2 rounded hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/*Hero Section*/}
      <div className="relative w-full h-[60vh] bg-cover bg-center">
        <img
          src="/hero.png"
          alt="Hero"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(96, 165, 250, 0.9) 0%, rgba(96, 165, 250, 0.1) 50%, transparent 100%)",
          }}
        />
        <div className="absolute pl-32 inset-0 flex items-center text-white">
          <div className="pl-8 max-w-xl text-left">
            <h2 className="text-3xl font-bold mb-3 max-w-[22rem]">
              <span className="text-blue-100">YOUR</span> MENTAL & PHYSICAL{" "}
              <span className="text-blue-100">
                WELLNESS OUR DUTY, YOUR RIGHT
              </span>
            </h2>
            <p className="text-lg mb-4">
              EquiLife empowers individuals to take control of their mental and
              physical well-being through personalized tools and AI-driven
              insights.
            </p>
            <a
              href="/signin"
              className="bg-white text-blue-700 font-semibold px-6 py-2 mb-14 rounded hover:bg-gray-200 inline-block cursor-pointer">
              Get Started
            </a>
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
          {/* Left Content */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Making <span className="text-blue-600">Holistic Health</span>{" "}
              Accessible for Everyone
            </h2>

            <p className="text-gray-700 mb-4">
              EquiLife envisions a future where mental, physical, and
              nutritional health are seamlessly connected powered by AI and
              community support. Join us in revolutionizing personal wellness,
              one habit at a time.
            </p>
            <p className="text-gray-700 mb-6">
              Uncover EquiLife’s cutting-edge approach to mental health
              tracking, fitness optimization, and nutrition science. From
              personalized AI assessments to gamified goals and supportive
              community networks, EquiLife enhances your well-being at every
              stage. Our mission is fueled by a team of clinicians, data
              scientists, and wellness experts, all committed to helping you
              thrive.
            </p>

            {/* Stats Cards */}
            <div className="flex gap-32 mb-6">
              {/* Card 1 */}
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">3,000+</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>

              {/* Card 2 */}
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">5+</p>
                <p className="text-sm text-gray-600">Countries</p>
              </div>

              {/* Card 3 */}
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">4.7+</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
            </div>

            <a
              href="/signin"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 inline-block cursor-pointer">
              Get Started
            </a>
          </div>

          {/* Right Image */}
          <div className="flex-1 relative">
            <img
              src="/doc.jpg"
              alt="Doctor meditating"
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Core Features */}
      <section className="mx-auto px-32 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">
              Core <span className="text-blue-500">Features</span>
            </h2>
            <p className="text-gray-600 max-w-3xl text-left">
              EquiLife integrates AI-driven insights, behavioral science, and
              community support into one seamless platform helping you thrive
              mentally, physically, and nutritionally.
            </p>
          </div>
          <div className="shrink-0">
            <a
              href="/signin"
              className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition inline-block cursor-pointer">
              Get Started
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mt-8">
          <div className="flex items-start bg-white rounded-lg p-3">
            <img
              src="/core1.png"
              alt="Mental Assessment"
              className="w-8 h-8 mr-3 mt-1"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">Mental Assessment</h3>
              <p className="text-gray-600 text-sm">
                It offers clinically backed self-assessment tools like PHQ-9,
                GAD-7, and GHQ-12 standardized tests to help you evaluate your
                mental wellness. These assessments are quick and provide a
                starting point for personalized guidance on your wellness
                journey.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-white rounded-lg p-3">
            <img
              src="/core2.png"
              alt="Physical Health"
              className="w-8 h-8 mr-3 mt-1"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">Physical Health</h3>
              <p className="text-gray-600 text-sm">
                Log your workouts, track your calorie burn, and monitor your
                consistency across different training styles all in one place.
                EquiLife helps you stay committed and celebrate every movement
                milestone.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-white rounded-lg p-3">
            <img
              src="/core3.png"
              alt="Nutrition Log"
              className="w-8 h-8 mr-3 mt-1"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">Nutrition Log</h3>
              <p className="text-gray-600 text-sm">
                Easily record your meals and water intake, view your
                macronutrient balance, and receive daily nutritional suggestions
                based on your goals. We’ll help you stay on track with small,
                sustainable habits.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-white rounded-lg p-3">
            <img
              src="/core4.png"
              alt="Goal & Progress"
              className="w-8 h-8 mr-3 mt-1"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">Goal & Progress</h3>
              <p className="text-gray-600 text-sm">
                Set personalized wellness goals and track your progress with
                clear visualizations. EquiLife keeps you motivated with
                real-time feedback and milestone badges.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-white rounded-lg p-3">
            <img
              src="/core5.png"
              alt="Gamification & Badges"
              className="w-8 h-8 mr-3 mt-1"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Gamification & Badges
              </h3>
              <p className="text-gray-600 text-sm">
                Boost your motivation with a gamified experience! Earn badges
                for consistency, unlock achievements, and challenge friends. In
                this feature, users can also manually add challenges.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-white rounded-lg p-3">
            <img
              src="/core6.png"
              alt="Community Interaction"
              className="w-8 h-8 mr-3 mt-1"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Community Interaction
              </h3>
              <p className="text-gray-600 text-sm">
                Join a safe, supportive space where users share insights and
                encouragement. Participate in discussions and celebrate your
                wins together. You're not alone — we're in this journey
                together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started */}

      <div className="bg-blue-100">
        <div className="columns-2 px-32 py-12">
          {/* Left Section */}
          <div className="py-12">
            <p className="font-bold">Start Your Equilife Journey Today!</p>
            <h2 className="text-3xl font-bold mb-2 pt-2">
              <span className="text-blue-500">Let's </span> Get Started
            </h2>
            <p className="pb-10 max-w-[26rem]">
              EquiLife is a dedicated partner for efficiently managing and
              optimizing health and wellness operations, currently delivering a
              robust suite of services in 5+ countries across five continents.
            </p>
            <a
              href="/signin"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block cursor-pointer">
              Get Started
            </a>
          </div>
          {/* Right Section */}
          <div className="relative flex items-center justify-center h-80">
            {/* Blue circle background */}
            <img
              src="/getStarted2.png"
              alt="getStarted2"
              className="absolute right-[0] bottom-[-1.25rem] h-60 z-0 left-auto translate-x-15"
              loading="lazy"
            />
            {/* Laptop (foreground) */}
            <img
              src="/getStarted.png"
              alt="getStarted1"
              className="relative h-80 z-10"
              loading="lazy"
            />
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
                    fill-rule="evenodd"
                    d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                    clip-rule="evenodd"
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
                    fill-rule="evenodd"
                    d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                    clip-rule="evenodd"
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

export default LandingPage;
