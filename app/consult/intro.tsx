// This redirects /consult/intro to /consult (the intro IS the consult index)
import { Redirect } from 'expo-router';

export default function ConsultIntro() {
  return <Redirect href="/consult" />;
}
