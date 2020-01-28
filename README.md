Juse: A Jest script transformer backed FUSE implementation, which allows you to access the FS with files transformed in place by Jest’s script transformer.

## Install

Install dependencies:

```bash
git clone https://github.com/alloy/juse.git
cd juse
yarn install
```

Configure FUSE kernel extension _once_:

```bash
yarn fuse-native is-configured
false
sudo yarn fuse-native configure
```

Build code:

```bash
yarn build
```

## Usage

Mount a jest configured project:

```bash
cd my-project
mkdir /tmp/my-project-mount-point
node path/to/juse/index.js /tmp/my-project-mount-point
```

Now files that would be transformed by jest in your project will be transformed in place when accessing them. E.g. for [a TS file](https://github.com/artsy/emission/blob/master/src/lib/ErrorReporting.ts) like:

```typescript
import { NativeModules } from "react-native"
const { Emission } = NativeModules

import { Sentry } from "react-native-sentry"

// AREmission sets this to "" if not configured, which is falsy in JS so this conditional is fine.
if (Emission.sentryDSN) {
  Sentry.config(Emission.sentryDSN).install()
}
```

…accessing it like so:

```bash
cat /tmp/my-project-mount-point/a-file-in-your-project.ts
```

…will show:

```javascript
var _reactNative = require("react-native");

var _reactNativeSentry = require("react-native-sentry");

var Emission = _reactNative.NativeModules.Emission;

if (Emission.sentryDSN) {
  _reactNativeSentry.Sentry.config(Emission.sentryDSN).install();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkVycm9yUmVwb3J0aW5nLnRzIl0sIm5hbWVzIjpbIkVtaXNzaW9uIiwiTmF0aXZlTW9kdWxlcyIsInNlbnRyeURTTiIsIlNlbnRyeSIsImNvbmZpZyIsImluc3RhbGwiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztJQUZRQSxRLEdBQWFDLDBCLENBQWJELFE7O0FBS1IsSUFBSUEsUUFBUSxDQUFDRSxTQUFiLEVBQXdCO0FBQ3RCQyw0QkFBT0MsTUFBUCxDQUFjSixRQUFRLENBQUNFLFNBQXZCLEVBQWtDRyxPQUFsQztBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmF0aXZlTW9kdWxlcyB9IGZyb20gXCJyZWFjdC1uYXRpdmVcIlxuY29uc3QgeyBFbWlzc2lvbiB9ID0gTmF0aXZlTW9kdWxlc1xuXG5pbXBvcnQgeyBTZW50cnkgfSBmcm9tIFwicmVhY3QtbmF0aXZlLXNlbnRyeVwiXG5cbi8vIEFSRW1pc3Npb24gc2V0cyB0aGlzIHRvIFwiXCIgaWYgbm90IGNvbmZpZ3VyZWQsIHdoaWNoIGlzIGZhbHN5IGluIEpTIHNvIHRoaXMgY29uZGl0aW9uYWwgaXMgZmluZS5cbmlmIChFbWlzc2lvbi5zZW50cnlEU04pIHtcbiAgU2VudHJ5LmNvbmZpZyhFbWlzc2lvbi5zZW50cnlEU04pLmluc3RhbGwoKVxufVxuIl19⏎
```

## TODO

- Read source files non-block, unlike what the ScriptTransformer does. Unsure what Jest offers.
- Fill build cache ahead of time. Unsure what Jest offers.
- Use Jest’s platform aware resolver to check if files should be transformed.
- Rename file extnames to .js