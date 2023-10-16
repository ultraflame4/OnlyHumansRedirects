# OnlyHumansRedirects
This is a very bad human captcha that redirects to your website.

![image](https://github.com/ultraflame4/OnlyHumansRedirects/assets/34125174/7ed88872-f77e-4e62-a478-e0b59bdb7c2c)


## Usage
This website accepts a `q` query parameter which contains information about the redirect encoded in base64 + json

**Example**

Redirect information:
```json
{
  "to" : "www.google.com"
}
```
Encoded in base 64:
`ewoidG8iOiJ3d3cuZ29vZ2xlLmNvbSIKfQ`

Final url:
`ultraflame4.github.io/OnlyHumansRedirect?q=ewoidG8iOiJ3d3cuZ29vZ2xlLmNvbSIKfQ`

This url will redirect to www.google.com

## redirect information json data stuff
Typings for the json
```typescript
interface dataJsonFormat {
    to: string,
    easter?: boolean
}
```
