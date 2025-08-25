import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  ar: {
    translation: {
      couple: "يوسف & زهرة",
      date: "بكل حب نرحب بكم",
      welcomeTitle: "أهلاً بكم في خطوبتنا",
      welcomeBody:
        "يسعدنا مشاركتكم هذه اللحظات الجميلة. التقطوا صوركم اللطيفة وارفِعوها هنا لتبقى ذكرى حلوة تجمعنا جميعاً.",
      yourName: "اسمك",
      submit: "ارسال الصور",
      thanksTitle: "شكراً لوجودكم!",
      thanksBody:
        "تم استلام صوركم بنجاح. سعداء جداً بمشاركتكم وتواجدكم معنا في هذه المناسبة الجميلة.",
      required: "من فضلك اكتب اسمك واختر صورة واحدة على الأقل.",
      switchTo: "English",
      footer: "بكل الحب — يوسف & زهرة",
      uploadPhotos: "ارفع الصور",
      multipleAllowed: "يمكن اختيار أكثر من صورة",
      dragDrop: "اسحب وأفلت الصور هنا،",
      browse: "أو اختر",
      imagesHint: "PNG, JPG, HEIC — حتى 10MB لكل صورة",
      chooseFiles: "اختر الملفات",
      imagesSelected_one: "صورة محددة",
      imagesSelected_other: "صور محددة",
      remove: "حذف",
      clearAll: "حذف الكل",
      loading: "جاري التحميل",
    },
  },
  en: {
    translation: {
      couple: "Youssof & Zahra",
      date: "With love, we welcome you",
      welcomeTitle: "Welcome to our Engagement",
      welcomeBody:
        "We’re thrilled to share this special day with you. Snap your lovely moments and upload them here to keep the memories alive!",
      yourName: "Your name",
      submit: "Send Photos",
      thanksTitle: "Thank you!",
      thanksBody:
        "Your photos were received successfully. We’re so happy to have you with us celebrating this special day.",
      required: "Please enter your name and select at least one image.",
      switchTo: "العربية",
      footer: "With love — Youssof & Zahra",
      uploadPhotos: "Upload photos",
      multipleAllowed: "you can select multiple images",
      dragDrop: "Drag & drop images here,",
      browse: "or browse",
      imagesHint: "PNG, JPG, HEIC — up to 10MB each",
      chooseFiles: "Choose files",
      imagesSelected_one: "image selected",
      imagesSelected_other: "images selected",
      remove: "Remove",
      clearAll: "Clear all",
      loading: "Loading",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ar",
    lng: "ar", // default Arabic
    interpolation: { escapeValue: false },
    detection: { order: ["querystring"], caches: [] }, // keep simple
  });

export default i18n;
