import { useAuth } from "~/components/base/auth-provider";
import type { Route } from "./+types/users";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar } from "~/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "streamCTRL | Users" },
    { name: "description", content: "Manage users in StreamCTRL!" },
  ];
}

export default function Root() {
  const auth = useAuth();
  const { data: session } = auth.authClient.useSession();
  const [users, setUsers] = useState<any[] | null>(null);

  useEffect(() => {
    const usersPromise = auth.authClient.admin.listUsers({
      query: {
        limit: 10,
      },
    });
    console.log(usersPromise);
    usersPromise.then((res: { data: { users: any[] } | null }) => {
      if (res.data) {
        setUsers(res.data.users);
      }
    });
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users &&
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user.image} alt={user.name} />
                  </Avatar>
                  {user.name}
                </div>
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
