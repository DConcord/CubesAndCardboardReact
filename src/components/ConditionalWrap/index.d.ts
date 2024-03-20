/// <reference types="react" />
interface ConditionalWrapProps {
  condition: boolean;
  wrap: (children: JSX.Element) => JSX.Element;
  children: JSX.Element;
}

declare const ConditionalWrap: ({ condition, children, wrap }: ConditionalWrapProps) => JSX.Element;
export { ConditionalWrap, ConditionalWrap as default };


// <ConditionalWrap
//   condition={task === "ModifySelf"}
//   wrap={(children) => (
//     <OverlayTrigger
//       placement="bottom"
//       delay={{ show: 100, hide: 400 }}
//       overlay={<Tooltip id="email">Contact an administrator to update your email address</Tooltip>}
//     >
//       {children}
//     </OverlayTrigger>
//   )}
// >
//   <FloatingLabel controlId="email" label="Email" className="mb-3">
//     <Form.Control
//       autoComplete="off"
//       placeholder="email"
//       type="email"
//       as="textarea"
//       onChange={handleInput}
//       disabled={task == "ModifySelf"}
//       defaultValue={task.startsWith("Modify") ? playerForm.email : ""}
//     />
//   </FloatingLabel>
// </ConditionalWrap> 