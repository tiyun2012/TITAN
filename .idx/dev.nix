{ pkgs, ... }: {
  idx.previews = {
    enable = true;
    previews = {
      web = {
        cwd = ".";
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--host"
          "0.0.0.0"
          "--port"
          "$PORT"
        ];
        manager = "web";
      };
    };
  };
}
